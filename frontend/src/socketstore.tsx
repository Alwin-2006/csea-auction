// store/useRealtimeStore.ts
import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { useUserStore } from "./store";
import { toast } from "sonner"
import { useNavigate } from "react-router-dom";
import { useBidStore } from "./bidStore";

const API_URL = import.meta.env.VITE_API_URL;
const socket: Socket = io(API_URL, {
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
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
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
      console.log("hello",bid);
      if(user?.id != bid.highestBidder && user?.id != bid.seller){
        toast.message(`${name} has out bid you!Click here to view your bid`);
      }
      updateBid(bid);
      
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
  on: (event, callback) => {
    socket.on(event, callback);
  },
  off: (event, callback) => {
    socket.off(event, callback);
  },
}));
