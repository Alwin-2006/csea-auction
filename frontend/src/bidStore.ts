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
  bidderName:string;
  title:string;
  status:string;
  currentBid : number;
  seller:User;
  highestBidder:string;
  bidderId: string;
  createdAt: number;
  bidHistory: Bid [];
};

type BidStore = {
  bids: Auction[];

  // actions
  addBid: (bid: Auction) => void;
  removeBid: (id: string) => void;
  clearBids: () => void;
  setBids: (bids: Auction[]) => void;
  updateBid:(bid:Auction) => void
  /*highestBid: () => Auction | null;*/
};

export const useBidStore = create<BidStore>((set, get) => ({
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


  /*highestBid: () => {
    const bids = get().bids;
    if (bids.length === 0) return null;
    return bids.reduce((max, bid) => (bid.amount > max.amount ? bid : max));
  }*/,
}));