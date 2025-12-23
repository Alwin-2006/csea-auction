import { Outlet, useNavigate } from "react-router-dom"
import Navbar from "./Navbar"
import { useEffect } from "react"
import { useRealtimeStore } from "@/socketstore"
import { Toaster } from "@/components/ui/sonner"
import axios from "axios"
import { useUserStore } from "@/store"
import { useBidStore } from "@/bidStore"


const API_URL = import.meta.env.VITE_API_URL;

const Layout = () => {
    
    const nav = useNavigate();
    const joinAuction = useRealtimeStore((s)=>s.joinAuction);
        const user = useUserStore((s)=>s.user);
        const setBids = useBidStore((s)=>s.setBids);
        const bids = useBidStore((s)=>s.bids);
        const joinMultiple = useRealtimeStore((s)=>s.joinMultiple);
        useEffect(() => {
            useRealtimeStore.getState().connect();
        }, []);
        useEffect(()=>{
            const fetch = async () =>{
                try{
                    console.log(API_URL);
                    const res = await axios.get(`${API_URL}/api/bid/bids?id=${user?.id}`);  
                    const data = res.data;
                    setBids(data.auctions); 
                    console.log("bids is ",data.auctions);
                    
                }catch (err) {
                    console.error("Error fetching auctions:", err);
                }
            }
            if(user)fetch();
           
        },[user]);
        useEffect(()=>{
            joinMultiple(bids.filter((ele)=>ele.highestBidder === user?.id).map((bid)=>bid._id),user?.username);
        },[bids,user])
        
    return(
            <div className="flex flex-col text-xl min-h-screen ">
                <Toaster position="top-right" />
                <div className="sticky top-0 z-50">
                    <Navbar />
                </div>
                <main className="p-5">
                <Outlet />
                </main>
            </div>
        
    )
}

export default Layout
