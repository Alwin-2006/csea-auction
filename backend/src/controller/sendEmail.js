import cron from 'node-cron';
import { google } from 'googleapis';
import Bid from '../models/Bids.js';
import User from '../models/User.js'; // Assuming User model is in this path


const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  // The redirect URI doesn't matter for server-side refresh token flow, but it must be one of the authorized URIs in your Google Cloud Console.
  `${process.env.BACKEND_URL || 'https://csea-auction-site.onrender.com'}/api/auth/google/callback`
);

async function sendEmail(sender, recipientEmail, subject, htmlBody) {
  try {
    if (!sender.refreshToken) {
      throw new Error(`User ${sender.email} does not have a refresh token.`);
    }

    // Set the refresh token for the specific user
    oAuth2Client.setCredentials({ refresh_token: sender.refreshToken });

    // Get a new access token
    const { token: accessToken } = await oAuth2Client.getAccessToken();

    // Re-initialize the auth client with the new access token
    oAuth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // The email needs to be base64url encoded
    const emailParts = [
      `From: ${sender.username} <${sender.email}>`,
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
      userId: 'me', // 'me' refers to the authenticated user
      requestBody: {
        raw: encodedEmail,
      },
    });

    console.log(`Email sent from ${sender.email} to ${recipientEmail}`);
    return true;

  } catch (err) {
    console.error('Gmail API Error:', err.response ? err.response.data : err.message);
    // If the token is revoked or expired, you might need to handle re-authentication
    if (err.response && err.response.data.error === 'invalid_grant') {
        // Remove the invalid refresh token
        await User.findByIdAndUpdate(sender._id, { $unset: { refreshToken: "" } });
        console.error(`Invalid refresh token for user ${sender.email}. Token has been removed. User must re-authenticate.`);
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

      // The "sender" for both emails will be the auction owner (seller).
      const auctionOwner = auction.seller;

      // 1. Send email to the seller
      const sellerEmailHtml = `
        <h1>Auction Ended!</h1>
        <p>Your auction <strong>${auction.title}</strong> has closed.</p>
        <p>The winner is ${auction.highestBidder.username}.</p>
        <p>Final Bid: $${auction.currentBid}</p>
      `;
      const success1 = await sendEmail(
        auctionOwner,
        auctionOwner.email,
        `Your Auction Closed: ${auction.title}`,
        sellerEmailHtml
      );

      // 2. Send email to the winner
      const winnerHTML = `
        <h1>Congratulations!</h1>
        <p>Congratulations ${auction.highestBidder.username}, you have won the auction for <strong>${auction.title}</strong>!</p>
        <p>Final Bid: $${auction.currentBid}</p>
        <p>The seller, ${auctionOwner.username}, will be in contact with you shortly.</p>
      `;
      const success2 = await sendEmail(
        auctionOwner, // Email is sent FROM the auction owner's account
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
  console.log('--- Auction Cron Job Initialized (Gmail API) ---');
  cron.schedule('* * * * *', checkAuctions);
};
