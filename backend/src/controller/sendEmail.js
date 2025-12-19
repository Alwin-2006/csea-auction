import cron from 'node-cron';
import mongoose from 'mongoose';
import fetch from 'node-fetch';
import Bid from '../models/Bids.js'; // Ensure path is correct
import nodemailer from "nodemailer"


const testAccount = await nodemailer.createTestAccount();
// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  service:"gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});

// Wrap in an async IIFE so we can use await.
let isJobRunning = false;
        
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
        from:{
            name:"SALE HOUSE",
            address:"alwinsnthsh@gmail.com",
        },
        to:to,
        subject:subject,
        html:html
    })
    console.log("sent mail");
      return true;
    
  } catch (err) {
    console.error('Email error:', err);
    return false;
  }
}

async function checkAuctions() {
  if (isJobRunning) return;
  isJobRunning = true;

  try {
    const now = new Date();
    const expiredAuctions = await Bid.find({
      status: 'pending',  
      bidHistory:{  $exists: true, $ne: [] },
      
        $or:[
        {endingDate: { $lte: now }},
        {mode:'dutch'}
        ]
      

    }).populate('seller').populate('highestBidder');

    for (const auction of expiredAuctions) {
        console.log("ending those auctions");
      if (!auction.seller || !auction.seller.email) {
        console.error(`No seller email found for auction: ${auction._id}`);
        continue;
      }

      const emailHtml = `
        <h1>Auction Ended!</h1>
        <p>Your auction <strong>${auction.title}</strong> has closed.</p>
        <p>Final Bid: $${auction.currentBid}</p>
      `;
      const winnerHTML = `
        <h1>Greetings!</h1>
        <p>Congratulations ${auction.highestBidder.username}, you have won <strong>${auction.title}</strong></p>
        <p>Final Bid: $${auction.currentBid}</p>
      `
      const success1 = await sendEmail(
        auction.seller.email, 
        `Auction Closed: ${auction.title}`, 
        emailHtml
      );
      console.log(auction.highestBidder.email);
      const success2 = await sendEmail(
        auction.highestBidder.email,
        `Congrats, ${auction.highestBidder.username}`,
        winnerHTML
      );
      if (success1 && success2) {
        auction.status = 'completed';
        await auction.save();
        console.log(`Auction ${auction._id} marked as completed.`);
      }else {
        console.log("didnt send email");    
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
    console.log('--- Auction Cron Job Initialized ---');
    cron.schedule('* * * * *', checkAuctions);

  };