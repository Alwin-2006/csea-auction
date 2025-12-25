import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import * as React from "react"
import { Card, } from "@/components/ui/card"
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useUserStore } from "./store.ts";
import { useInView } from 'react-intersection-observer';




export interface AuctionItem {
  _id: number;
  title: string;
  description: string;
  currentBid: number;
  bids: number;
  startingDate:Date,
  endingDate: Date,
  mode:string,
  image: string;   
}
interface ItemCardProps {
  item: AuctionItem;
}
function ItemCard({item}:ItemCardProps){
  const [seconds, setSeconds] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [hours, setHours] = useState(0);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const date = new Date(item.endingDate).getTime() ; // endingDate from your item
      const distance = date - now;
      if (distance <= 0) {
        setHours(0);
        setMinutes(0);
        setSeconds(0);
        clearInterval(interval);
        return;
      }

      setHours(Math.floor(distance / (1000 * 60 * 60)));
      setMinutes(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
      setSeconds(Math.floor((distance % (1000 * 60)) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [item.endingDate]);

      return (
        <Link to={`/bid/${item._id}`}>
        <div className="bg-white w-70 h-100 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer group flex flex-col">
          <div className="h-64 overflow-hidden flex flex-col">
          <img src = {item.image} className='object-contain w-full '/>
          </div>
          <div className="-mt-12 flex justify-end px-4 pointer-events-none z-10">
            <div className="px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full flex items-center gap-1 pointer-events-auto shadow-lg border border-stone-200">
              <span className="text-neutral-800">{!hours && !minutes && !seconds?"END":`${hours}:${minutes}:${seconds}`}</span>
            </div>
          </div>
          
          <div className="p-6 pt-4">
            <h3 className="text-slate-900 mb-2">{item.title}</h3>
            <p className="text-slate-600 mb-4">{item.description.substring(0,25)}{item.description.length > 25?"...":""}</p>
            
            <div className="flex items-start justify-between">         
                <Card className={`${item.mode === 'dutch'?"bg-black":"bg-amber-400" } text-white self-start p-4`}>
                    Standard
                </Card>
            </div>
            
            
          </div>
        </div>
        </Link>
    )
}


const API_URL = import.meta.env.VITE_API_URL;
function App() {
  const [bids,setBids]= useState<AuctionItem[]>([]);
  const user = useUserStore((state)=>state.user);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const trending = ["https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1765871321366-c2b86bd243b0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHx0b3BpYy1mZWVkfDN8Ym84alFLVGFFMFl8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

  ]
  // ...

  React.useEffect(() => {
    const fetchBids = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/bid/bids`);
        // Ensure res.data.auctions is an array before setting state
        const auctions = res.data?.auctions || [];
        setBids(auctions);
      } catch (err) {
        console.error("Error fetching auctions:", err);
        // Also set to an empty array on error to be safe
        setBids([]);
      }
    };
  
    fetchBids();
    
  }, []);
  return (
    <>
    <div className='flex flex-col justify-between items-center text-sm md:text-lg bg-white h-full'>
        
            <div className="gradient-bg w-full">
              <div className='flex flex-col items-center text-5xl md:text-9xl md:gap-20 gap-5 text-white my-20 fade-in-up'>
                <div>The <span className='font-bold text-black'>PERFECT</span> Place</div>
                <span className='text-2xl md:text-6xl text-black'>Where the best deals are made!</span>
              </div>
            </div>
          <div className="py-16 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-12 self-start">
                <h2 className="text-slate-900 mb-2">Hottest Items</h2>
                <p className="text-slate-600">Don't miss out on these trending auctions</p>
              </div>
              
              <div ref={ref} className="flex flex-col md:grid md:grid-cols-3  justify-center gap-4">
                {bids.map((card, index) => (
                  <div key={index} className={inView ? 'card-fade-in-up' : 'opacity-0'}>
                    <ItemCard item={card} />
                  </div>
                ))}
              </div>

              <div className="mt-12 text-center">
                <button className="px-8 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                  View All Auctions
                </button>
              </div>
            </div>
          </div>
      </div>
    </>
  )
}

export default App