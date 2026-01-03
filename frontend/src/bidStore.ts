import { create } from "zustand";


type Bid = {
    bidder:string,
    amount:number,
}
type User = {
  _id:string;
}
 type Auction = {
    _id: string;
    title: string;
    description?: string;
    seller: User;
    mode?: string;
    currentBid: number;
    startingDate?: number;
    startingBid?: number;
    endingDate?: number;
    image?: string;
    status?: 'active' | 'closed';
    highestBidder?: string;
    bidderId?: string;
    createdAt?: number;
    bidHistory?: {
        bidder: string,
        amount: number,
    }[];
    highestBidderProfilePic?: string; 
};

type BidStore = {
  bids: Auction[];

  addBid: (bid: Auction) => void;
  removeBid: (id: string) => void;
  clearBids: () => void;
  setBids: (bids: Auction[]) => void;
  updateBid:(bid:Auction) => void
};

export const useBidStore = create<BidStore>((set) => ({
  bids: [],

  addBid: (bid) =>
    set((state) => ({
      bids: [...state.bids, bid],
    })),

  removeBid: (id) =>
    set((state) => ({
      bids: state.bids.filter((b) => b._id !== id),
    })),

  clearBids: () => set({ bids: [] }),

  setBids: (bids) => set({ bids }),

  updateBid: (updatedBid)=> set((state) => ({
    bids: state.bids.map((bid) =>
      bid._id === updatedBid._id
        ? { ...bid, ...updatedBid }
        : bid
    ),
  }))
,
}));