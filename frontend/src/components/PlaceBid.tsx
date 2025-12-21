import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Flame,
    Users,
    TrendingUp,
    Clock,
    Gavel,
    AlertCircle,
    ChevronDown
} from 'lucide-react';
import { useUserStore } from "../store.ts";
import axios from 'axios';

import { useRealtimeStore } from '@/socketstore.tsx';
import { useBidStore } from '@/bidStore.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';


const API_URL = import.meta.env.VITE_API_URL || 'https://csea-auction-site.onrender.com'

type user = {
    username:string,
    profilePicture:string,
}

interface Auction {
        _id: string;
        title: string;
        description?: string;
        seller:user;
        mode?:string;
        currentBid: number;
        startingDate?:number;
        startingBid?: number;
        endingDate?: number; 
        image?: string;
    
}


interface ImageBadgeProps { icon: React.ReactNode; text: string; }
interface InfoCardProps { icon: React.ReactNode; title: string; mainValue: string; subValue?: string; iconColor?: string; isCurrency?: boolean; }

const ImageBadge: React.FC<ImageBadgeProps> = ({ icon, text }) => (
    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium">
        {icon}
        <span>{text}</span>
    </div>
);

const InfoCard: React.FC<InfoCardProps> = ({ icon, title, mainValue, subValue = "", iconColor = "text-gray-500", isCurrency = false }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-gray-50 ${iconColor}`}>{icon}</div>
        <div>
            <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
            <h3 className={`text-xl font-bold ${isCurrency ? 'text-orange-500' : 'text-gray-900'}`}>{mainValue}</h3>
            <p className="text-sm text-gray-400 mt-1">{subValue}</p>
        </div>
    </div>
);

const AuctionPage: React.FC = () => {
    const placeBid = useRealtimeStore((s) => s.placeBid);
    const bids = useBidStore((s)=>s.bids);
    const { id } = useParams<{ id: string }>(); 
    const user = useUserStore((s)=>s.user);
    const [auction, setAuction] = useState<Auction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [amount,setAmount] = useState("");
    const [timeRemaining, setTimeRemaining] = useState('Loading...'); 
    const addBid = useBidStore((s)=>s.addBid);
    const token = localStorage.getItem('token'); 
    const [profile,setProfile] = useState("");
    const [highestBidder,setHighestBidder] = useState("");
    useEffect(() => {
        if (!id) {
            setLoading(false);
            setError("Auction ID not found in URL.");
            return;
        }
        const ind = bids.find((ele)=>ele._id === auctionData._id)
        if(ind){
            setAuction(ind);
        }
        const fetchAuction = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(`${API_URL}/api/bid/bids/${id}`, { 
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                });
                setAuction(response.data.auction); 
                setHighestBidder(response.data.highestBidder);
                setProfile(response.data.profilePic);
                

            } catch (err) {
                setError("Failed to fetch auction details.");
                console.error("Fetch error:", err);

            } finally {
                setLoading(false);
            }
        };
        
        fetchAuction();
        
    }, [id, token]); 
    //for setting the timer
    
    useEffect(() => {
        if (!auction || !auction.endingDate || auction.mode !== 'dutch') return;

        const endDate = new Date(auction.endingDate).getTime(); 
        const startDate = new Date(auction.startingDate).getTime(); 
        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = endDate - now;
            const d1 = now - startDate;
            if (distance <= 0) {
                setTimeRemaining("EXPIRED");
                return true; 
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes1 = Math.floor((d1/ (1000 * 60)));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            let timeString = '';
            if (days > 0) timeString += `${days}d `;
            timeString += `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            setAmount(String(auctionData.startingBid - minutes1*auctionData.currentBid));
            setTimeRemaining(timeString);
            return false; 
        };

        if (updateCountdown()) return;

        const interval = setInterval(() => {
            if (updateCountdown()) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);

    }, [auction]); 
   
    const handleSubmit = () =>{
        
        if(!bids.find(((ele)=>ele._id === auction?._id)))addBid({
            _id: String(id),
            title:auction!.title,
            mode:auction.mode,
            currentBid: Number(amount),
            bidderName:user!.username,
            bidderId:user!.id
        });
        placeBid({
            mode:auction?.mode,
            auctionId: String(id),
            amount: Number(amount),
            bidderName:user!.username,
            bidderId:String(user?.id)
        })
        setProfile(user?.profilePicture);
        setHighestBidder(user?.username);
    }
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-xl">Loading auction details...</div>;
    }

    if (error || !auction) {
        return <div className="min-h-screen flex flex-col items-center justify-center text-xl text-red-600">
            <AlertCircle size={32} className="mb-4" />
            {error || "Auction details could not be loaded."}
        </div>;
    }
    
   
    let auctionData = auction;
    
    console.log("nice one",auctionData.currentBid,auctionData.startingBid);
    return (
        <div className="min-h-screen p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
            
                <div className="lg:col-span-2 space-y-6">
                    
          
                    <div className="relative h-[450px] rounded-3xl overflow-hidden group">
                        <img 
                            src={auctionData.image || "/api/placeholder/800/600"} 
                            alt={auctionData.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                        <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                            <div className="flex flex-wrap gap-3 mb-4">
                                <ImageBadge icon={<Avatar className='h-5 w-5'><AvatarImage src={auctionData.seller.profilePicture}   referrerPolicy="no-referrer" className="rounded-full object-fit"/></Avatar>} text={`Sold by ${auctionData.seller.username}`} />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{auctionData.title}</h1>
                            <p className="text-gray-300 text-lg">{auctionData.description}</p>
                        </div>
                    </div>

                   
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                        <InfoCard 
                            icon={<Clock size={24} />} 
                            title="Time Remaining" 
                        
                            mainValue={timeRemaining} 
                            subValue={timeRemaining === 'EXPIRED' ? "Auction has ended" : ""}
                            iconColor="text-blue-500"
                        />
                            {
                                auctionData.mode === 'standard'?
                            <InfoCard 
                            icon={
                                <div className='bg-white'>
                                    <Avatar className='h-5 w-5 rounded-full '>
                                        <AvatarImage src={profile}   referrerPolicy="no-referrer" className="rounded-full object-fit"/>
                                        <AvatarFallback>{highestBidder[0]}</AvatarFallback>
                                    </Avatar>
                                </div>
                            } 
                            title="Highest Bidder" 
                            mainValue={highestBidder} 
                            subValue={timeRemaining === 'EXPIRED' ? "Auction has ended" : ""}
                            iconColor="text-blue-500"
                        />:
                        <></>
                        }
                    </div>
                </div>

          
                <div className="space-y-6">
                    
          
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                      
                        <div className="bg-orange-500 p-5 text-white flex items-center gap-2">
                            <Gavel size={20} />
                            <div>
                                <h2 className="font-bold text-lg leading-tight">Place Your Bid</h2>
                                <p className="text-orange-100 text-sm">Enter your maximum bid amount</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                     
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bid Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                                    <input 
                                        type="number" 
                                        defaultValue={auctionData.mode === 'standard'?auction.currentBid:amount} 
                                        disabled = {auctionData.mode === 'dutch'}
                                        onChange={(e)=>setAmount(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none font-bold text-gray-900 text-lg"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <ChevronDown size={20} />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">Starting bid: Rs {auction.startingBid}</p>
                                {auction.mode === 'dutch'?<p className="text-sm text-gray-500 mt-2">Price Dropoff rate: Rs {auction.currentBid}</p>:<></>}
                            </div>

                           
                            <button disabled={timeRemaining === 'EXPIRED'} className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${timeRemaining === 'EXPIRED' ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 transition-colors cursor-pointer'}`} onClick={handleSubmit}>
                                <Gavel size={20} />
                                {timeRemaining === 'EXPIRED' ? 'Auction Ended' : 'Place Bid'}
                            </button>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default AuctionPage;