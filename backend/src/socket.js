import { Server } from 'socket.io';
import Bid from './models/Bids.js';
import User from './models/User.js';
import nodemailer from "nodemailer"


let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL ,'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  
  io.on('connection', (socket) => {
    
    console.log('New user connected:', socket.id);
    
    // Join auction room
    socket.on('join-auction', (auctionId) => {
      socket.join(`auction-${auctionId}`);
      console.log(`User ${socket.id} joined auction ${auctionId}`);
    });

    socket.on('join-multiple',(auctionIds,username) =>{
      console.log(auctionIds);
      auctionIds.forEach(auctionId => {
        socket.join(`auction-${auctionId}`);
        if(username)console.log(username," joined ",auctionId);
      });
    })
    // Leave auction room
    socket.on('leave-auction', (auctionId) => {
      socket.leave(`auction-${auctionId}`);
      console.log(`User ${socket.id} left auction ${auctionId}`);
    });
    // Place a bid
    socket.on('place-bid', async (bidData) => {
      const { auctionId, amount, bidderId, bidderName, mode } = bidData;
      
      try {
        // Find the user placing the bid to get their profile picture
        const bidder = await User.findById(bidderId);
        const profilePic = bidder ? bidder.profilePicture : '';

        // Update the auction document
        const updatedBid = await Bid.findByIdAndUpdate(
          auctionId,
          {
            $set: {
              highestBidder: bidderId,
              currentBid: amount,
            },
            $push: {
              bidHistory: {
                bidder: bidderId,
                amount: amount,
              }
            },
            $inc: { totalBids: 1 }
          },
          { new: true }
        );

        if (updatedBid) {
          // Convert the Mongoose document to a plain object to add the profile pic
          const updatedBidObject = updatedBid.toObject();
          updatedBidObject.highestBidderProfilePic = profilePic;
          
          // Emit the event with the enhanced object
          socket.broadcast.to(`auction-${auctionId}`).emit('bid-placed', updatedBidObject, bidderName);
          socket.emit('bid-placed', updatedBidObject, bidderName);
          
          console.log(`Bid placed on auction ${auctionId}: $${amount}`);
        } else {
          console.error(`Failed to find and update auction ${auctionId}`);
        }
      } catch (error) {
        console.error('Error processing bid:', error);
      }
    });

    // Update auction status
    socket.on('auction-ended', (auctionId) => {
      io.to(`auction-${auctionId}`).emit('auction-finished', {
        auctionId,
        timestamp: new Date()
      });
      console.log(`Auction ${auctionId} has ended`);
    });

    // Notify auction updates
    socket.on('update-auction', (auctionData) => {
      io.to(`auction-${auctionData.auctionId}`).emit('auction-updated', auctionData);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};