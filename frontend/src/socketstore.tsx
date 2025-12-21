// store/useRealtimeStore.ts
import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { useUserStore } from "./store";
import { toast } from "sonner"
import { useNavigate } from "react-router-dom";
import { useBidStore } from "./bidStore";

const socket: Socket = io("https://csea-auction-site.onrender.com", {
  autoConnect: false,
  withCredentials: true,
});
let listenersRegistered = false;

type Bid = {
  amount: number;
  bidderId: string;
  bidderName: string;
  timestamp: string;
};

type Auction = {
  auctionId: string;
  status: "active" | "finished";
};

type RealtimeState = {
  auctions: Record<string, Auction>;
  bids: Record<string, Bid[]>;
  activeAuctionId: string | null;

  connect: () => void;
  joinAuction: (auctionId: string) => void;
  leaveAuction: (auctionId: string) => void;
  placeBid: (data: {
    mode:string;
    auctionId: string;
    amount: number;
    bidderId: string;
    bidderName: string;
  }) => void; 
  joinMultiple: (auctionIds:string [],username:string) => void;
};
const { user } = useUserStore.getState();

export const useRealtimeStore = create<RealtimeState>((set, get) => (
  {
  auctions: {},
  bids: {},
  activeAuctionId: null,
  connect: () => {
    const updateBid = useBidStore.getState().updateBid;
    const bids = useBidStore.getState().bids;
    if (!socket.connected) {
      socket.connect();
    }

    if (listenersRegistered) return;
    listenersRegistered = true;

    socket.on("bid-placed", ( bid,name ) => {
      console.log("hello",bids);
      if(user?.id != bid.highestBidder){ 
        toast.message(`${name} has out bid you!Click here to view your bid`);
      }
      updateBid(bid);
      console.log("hello hey",bid);
      
    })

    socket.on("auction-updated", (auctionData) => {
      set((state) => ({
        auctions: {
          ...state.auctions,
          [auctionData.auctionId]: auctionData,
        },
      }));
    });

    socket.on("auction-finished", ({ auctionId }) => {
      set((state) => ({
        auctions: {
          ...state.auctions,
          [auctionId]: {
            ...state.auctions[auctionId],
            status: "finished",
          },
        },
      }));
    });
  },

  joinAuction: (auctionId) => {
    socket.emit("join-auction", auctionId);
    set({ activeAuctionId: auctionId });
  },

  leaveAuction: (auctionId) => {
    socket.emit("leave-auction", auctionId);
    if (get().activeAuctionId === auctionId) {
      set({ activeAuctionId: null });
    }
  },
  joinMultiple:(auctionIds,username)=>{
      socket.emit("join-multiple",auctionIds,username);
  
  },
  placeBid: (data) => {
    socket.emit("place-bid", data);
  },
}));