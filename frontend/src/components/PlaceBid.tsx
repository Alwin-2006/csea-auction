import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Clock,
    Gavel,
    AlertCircle,
    ChevronDown
} from 'lucide-react';
import { useUserStore } from "../store.ts";
import axios from 'axios';
import { useRealtimeStore } from '@/socketstore.tsx';
import { useBidStore } from '@/bidStore.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const API_URL = import.meta.env.VITE_API_URL;

// Update interface to match the populated backend data
interface User {
    _id: string;
    username: string;
    profilePicture?: string;
    email?: string;
}

interface Auction {
    _id: string;
    title: string;
    description: string;
    seller: User;
    mode: string;
    currentBid: number;
    startingDate: number;
    startingBid: number;
    endingDate: number;
    image?: string;
    highestBidderProfilePic?: string; // It's good to have this typed
}
interface ImageBadgeProps { icon: React.ReactNode; text: string; }
const ImageBadge: React.FC<ImageBadgeProps> = ({ icon, text }) => (
    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium">
        {icon}
        <span>{text}</span>
    </div>
);
const AuctionPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const placeBid = useRealtimeStore((s) => s.placeBid);
    const joinAuction = useRealtimeStore((s) => s.joinAuction);
    const on = useRealtimeStore((s) => s.on);
    const off = useRealtimeStore((s) => s.off);
    const user = useUserStore((s) => s.user);
    const [auction, setAuction] = useState<Auction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [amount, setAmount] = useState("");
    const [timeRemaining, setTimeRemaining] = useState('Loading...');
    const [isDisabled, setIsDisabled] = useState(false);

    const handleClick = () => {
      setIsDisabled(true);
      setTimeout(() => {
        setIsDisabled(false);
      }, 5000); //to prevent spam submitting
      console.log("Button clicked!");
    };
    const [highestBidderName, setHighestBidderName] = useState<string>("No bids yet");
    const [highestBidderPic, setHighestBidderPic] = useState<string>("");

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchAuction = async () => {
            if (!id) return;
            try {
                const response = await axios.get(`${API_URL}/api/bid/bids/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setAuction(response.data.auction);
                joinAuction(response.data.auction._id);
                const hb = response.data.highestBidder;
                setHighestBidderName(hb && typeof hb === 'object' ? hb.username : (hb || "No bids yet"));
                setHighestBidderPic(response.data.profilePic || "");

                if (response.data.auction.mode === 'standard') {
                    setAmount(String(response.data.auction.currentBid));
                }
            } catch (err) {
                console.error("error",err);
                setError("Failed to fetch auction details.");
            } finally {
                setLoading(false);
            }
        };
        fetchAuction();
    }, [id, token, joinAuction]);

    useEffect(() => {
        const handleBidPlaced = (updatedAuction: Auction, bidderName: string) => {
            if (updatedAuction._id === id) {
                setAuction(prevAuction => {
                    if (prevAuction) {
                        return { ...prevAuction, currentBid: updatedAuction.currentBid };
                    }
                    return null;
                });
                
                setHighestBidderName(bidderName);
                if (updatedAuction.highestBidderProfilePic) {
                    setHighestBidderPic(updatedAuction.highestBidderProfilePic);
                }
            }
        };

        on('bid-placed', handleBidPlaced);

        // Clean up the listener when the component unmounts
        return () => {
            off('bid-placed', handleBidPlaced);
        };
    }, [id, on, off]);

    // Timer Logic
    useEffect(() => {
        if (!auction || !auction.endingDate) return;
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(auction.endingDate).getTime();
            const diff = end - now;

            if (diff <= 0) {
                setTimeRemaining("EXPIRED");
                clearInterval(interval);
                return;
            }
            const d = Math.floor((diff)/ (1000 * 60 * 60* 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeRemaining(`${String(d).padStart(1, '0')}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [auction]);

    const handleSubmit = () => {
        if (!auction || !user) return;
        if(Number(amount) <= auction.currentBid){
            alert(`Current Bid is ${auction.currentBid}. You need to place a bid higher than that!`);
            return
        }
        // Optimistic UI update
        setHighestBidderName(user.username);
        setHighestBidderPic(user.profilePicture || "");
        setIsDisabled(true);
        setTimeout(() => {
            setIsDisabled(false);
        }, 5000);

        placeBid({
            mode: auction.mode,
            auctionId: String(id),
            amount: Number(amount),
            bidderName: user.username,
            bidderId: String(user.id || user._id)
        });
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (error || !auction) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Header Image Section */}
                    <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-lg">
                        <img src={auction.image || "https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"} className="w-full h-full object-cover" alt={auction.title} />
                        <div className="absolute inset-0 bg-black/40" />
                        <div className="absolute bottom-6 left-6 text-white">
                            <div className="flex flex-wrap gap-3 mb-4">
                                    <ImageBadge icon={<Avatar className='h-5 w-5'><AvatarImage src={auction.seller.profilePicture}   referrerPolicy="no-referrer" className="rounded-full object-fit"/></Avatar>} text={`Sold by ${auction.seller.username}`} />
                            </div>
                            <h1 className="text-3xl font-bold">{auction.title}</h1>
                            <p className="opacity-90">{auction.description}</p>
                        </div>
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
                            <Clock className="text-blue-500" />
                            <div>
                                <p className="text-sm text-gray-500">Time Left</p>
                                <p className="text-xl font-bold">{timeRemaining}</p>
                            </div>
                        </div>

                        {auction.mode === 'standard' && (
                            <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={highestBidderPic} />
                                    <AvatarFallback className="bg-orange-100 text-orange-600">
                                        {highestBidderName[0]?.toUpperCase() || "?"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm text-gray-500">Highest Bidder</p>
                                    <p className="text-xl font-bold">
                                        {String(highestBidderName)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bidding Sidebar */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm h-fit">
                    <div className="flex items-center gap-2 mb-6 text-orange-600 font-bold">
                        <Gavel /> <span>Place Your Bid</span>
                    </div>
                    <div className="space-y-4">
                        <label className="text-sm font-medium">Bid Amount (₹)</label>
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-3 bg-gray-50 border rounded-xl font-bold text-lg"
                        />
                        <button 
                            onClick={handleSubmit}
                            disabled={timeRemaining === "EXPIRED" || auction.seller._id === String(user?.id)||isDisabled }
                            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:bg-gray-300"
                        >
                            {timeRemaining === "EXPIRED" ? "Auction Ended" : "Confirm Bid"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuctionPage;