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

const API_URL = import.meta.env.VITE_API_URL || 'https://csea-auction-site.onrender.com';

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
}

const AuctionPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const placeBid = useRealtimeStore((s) => s.placeBid);
    const bids = useBidStore((s) => s.bids);
    const addBid = useBidStore((s) => s.addBid);
    const user = useUserStore((s) => s.user);

    const [auction, setAuction] = useState<Auction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [amount, setAmount] = useState("");
    const [timeRemaining, setTimeRemaining] = useState('Loading...');

    // These must be STRINGS to prevent the Object Rendering Error
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
                
                // IMPORTANT: Ensure we extract the string from the object
                const hb = response.data.highestBidder;
                setHighestBidderName(typeof hb === 'object' ? hb.username : (hb || "No bids yet"));
                setHighestBidderPic(response.data.profilePic || "");

                if (response.data.auction.mode === 'standard') {
                    setAmount(String(response.data.auction.currentBid));
                }
            } catch (err) {
                setError("Failed to fetch auction details.");
            } finally {
                setLoading(false);
            }
        };
        fetchAuction();
    }, [id, token]);

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

            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [auction]);

    const handleSubmit = () => {
        if (!auction || !user) return;
        
        // Use user.username (string) instead of user (object)
        setHighestBidderName(user.username);
        setHighestBidderPic(user.profilePicture || "");

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
                        <img src={auction.image || "/placeholder.png"} className="w-full h-full object-cover" alt={auction.title} />
                        <div className="absolute inset-0 bg-black/40" />
                        <div className="absolute bottom-6 left-6 text-white">
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
                                    <AvatarImage src={highest
