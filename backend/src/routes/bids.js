import jwt from 'jwt-simple';
import express from 'express';
import Bid from "../models/Bids.js";
import { getIO, initializeSocket } from '../socket.js';
import axios from "axios"
import nodemailer from "nodemailer"
import emailjs from '@emailjs/nodejs';
const router = express.Router();

import fetch from 'node-fetch';

const serviceID = process.env.EMAIL_SERVICE_ID;
const templateID = process.env.TEMPLATE_ID;
const privateKey = process.env.PRIVATE_KEY; // Only this





router.post('/create-bid', async (req,res) => {
    try{
        const data = req.body;
        console.log("hi123",data);
        const newBid = new Bid(req.body);

        const saved = await newBid.save();
        
        return res.status(201).json({
            message:"Success!"
        })
    }catch(err){
        console.error("error creating bid",err);
        return res.status(500).json({error:err.message});
    }
})


router.get('/bids', async (req, res) => {
    try {
        const { id } = req.query;
        
        let ongoingAuctions;
        if(!id){ ongoingAuctions = await Bid.find({ status: 'pending' }); }
        else {
             ongoingAuctions = await Bid.find({$or:[{"bidHistory.bidder":id},{seller:id}]})
              .populate('seller', 'username email')
              .populate('highestBidder', 'username email');
        }
       
        return res.status(200).json({ auctions: ongoingAuctions });
    } catch (err) {
        console.error("error fetching ongoing auctions", err);
        return res.status(500).json({ error: err.message });
    }
});

router.get('/bids/:id', async (req, res) => {
    const auctionId = req.params.id;
    if (!auctionId) {
        return res.status(400).json({ message: "Auction ID is required." });
    }

    try {
        const auctionDetails = await Bid.findById(req.params.id)
        .populate("bidHistory.bidder", "username profilePicture")
        .populate("highestBidder", "username profilePicture")
        .populate("seller","username profilePicture");
        
        
        if (!auctionDetails) {
            return res.status(404).json({ message: "Auction not found." });
        }
        
        let highestBid;
        if(auctionDetails.bidHistory && auctionDetails.bidHistory.length > 0){
            const lastBid = auctionDetails.bidHistory[auctionDetails.bidHistory.length -1];
            highestBid= lastBid.bidder.username;
        }

        return res.status(200).json({ 
            auction: auctionDetails,
            highestBidder: highestBid || "",
            profilePic:auctionDetails.highestBidder?.profilePicture || ""
            
        });
        
    } catch (err) {
        console.error("error fetching auction details", err);
        if (err.name === 'CastError') {
            return res.status(400).json({ message: "Invalid Auction ID format." });
        }
        return res.status(500).json({ error: err.message });
    }
});

export default router;