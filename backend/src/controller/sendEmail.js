import cron from 'node-cron';
import { google } from 'googleapis';
import Bid from '../models/Bids.js';
import SystemSettings from '../models/SystemSettings.js'; 


const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
 
  `${process.env.BACKEND_URL || 'https://csea-auction-site.onrender.com'}/api/auth/google/sender-callback` 
);

async function sendEmail(recipientEmail, subject, htmlBody) {
  try {
    const settings = await SystemSettings.findOne({});
    if (!settings || !settings.gmailRefreshToken || !settings.gmailSenderEmail) {
      throw new Error('Gmail sender is not configured. Please authorize the sender account.');
    }


    oAuth2Client.setCredentials({ refresh_token: settings.gmailRefreshToken });


    const { token: accessToken } = await oAuth2Client.getAccessToken();


    oAuth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });


    const emailParts = [
      `From: Your Auction App <${settings.gmailSenderEmail}>`,
      `To: ${recipientEmail}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      htmlBody
    ];
    const email = emailParts.join('\n');

    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    console.log(`Email sent from ${settings.gmailSenderEmail} to ${recipientEmail}`);
    return true;

  } catch (err) {
    console.error('Gmail API Error:', err.response ? err.response.data : err.message);
    
    if (err.response && err.response.data.error === 'invalid_grant') {

        await SystemSettings.findOneAndUpdate({}, { $unset: { gmailRefreshToken: "", gmailSenderEmail: "" } });
        console.error(`Invalid refresh token for system sender. Please re-authorize the sender account.`);
    }
    return false;
  }
}

let isJobRunning = false;

async function checkAuctions() {
  if (isJobRunning) {
    return;
  }
  isJobRunning = true;

  try {
    const now = new Date();
    const expiredAuctions = await Bid.find({
      status: 'pending',
      bidHistory: { $exists: true, $ne: [] },
      $or: [
        { endingDate: { $lte: now } },
        { mode: 'dutch' }
      ]
    }).populate('seller').populate('highestBidder');

    for (const auction of expiredAuctions) {
      if (!auction.seller || !auction.seller.email || !auction.highestBidder) {
        console.error(`Auction ${auction._id} is missing seller/winner info.`);
        continue;
      }

      // 1. Send email to the seller
      const sellerEmailHtml = `
        <h1>Auction Ended!</h1>
        <p>Your auction <strong>${auction.title}</strong> has closed.</p>
        <p>The winner is ${auction.highestBidder.username}.</p>
        <p>Final Bid: $${auction.currentBid}</p>
      `;
      const success1 = await sendEmail(
        auction.seller.email,
        `Your Auction Closed: ${auction.title}`,
        sellerEmailHtml
      );

      // 2. Send email to the winner
      const winnerHTML = `
        <h1>Congratulations!</h1>
        <p>Congratulations ${auction.highestBidder.username}, you have won the auction for <strong>${auction.title}</strong>!</p>
        <p>Final Bid: $${auction.currentBid}</p>
        <p>The seller, ${auction.seller.username}, will be in contact with you shortly.</p>
      `;
      const success2 = await sendEmail(
        auction.highestBidder.email,
        `You Won the Auction: ${auction.title}`,
        winnerHTML
      );
      
      if (success1 && success2) {
        auction.status = 'completed';
        await auction.save();
        console.log(`Auction ${auction._id} marked as completed.`);
      } else {
        console.log(`Failed to send one or more emails for auction ${auction._id}.`);
      }
    }
  } catch (error) {
    console.error('Cron Error:', error);
  } finally {
    isJobRunning = false;
  }
}

// Export the initialization function
export const initAuctionCron = () => {
  console.log('--- Auction Cron Job Initialized (Gmail API - System Sender) ---');
  cron.schedule('* * * * *', checkAuctions);
};