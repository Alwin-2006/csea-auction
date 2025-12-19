import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Link } from 'react-router-dom'
import axios from 'axios'
import { min } from 'date-fns'
import { useUserStore } from "./store.ts";
import { useRealtimeStore } from './socketstore.tsx'


const auctionItems = [
  {
    id: 1,
    title: 'Diamond Necklace',
    description: '18K white gold with 25ct diamonds',
    currentBid: 85000,
    bids: 23,
    endTime: '4h 32m',
    image: 'https://images.unsplash.com/photo-1481980235850-66e47651e431?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWFtb25kJTIwamV3ZWxyeXxlbnwxfHx8fDE3NjQ4MjQ3MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 2,
    title: 'Victorian Writing Desk',
    description: 'Mahogany desk circa 1880',
    currentBid: 12500,
    bids: 15,
    endTime: '1d 2h',
    image: 'https://images.unsplash.com/photo-1544691560-fc2053d97726?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbnRpcXVlJTIwZnVybml0dXJlfGVufDF8fHx8MTc2NDg0NDMxNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 3,
    title: 'First Edition Book Set',
    description: 'Complete works of Shakespeare, 1623',
    currentBid: 450000,
    bids: 42,
    endTime: '6h 15m',
    image: 'https://images.unsplash.com/photo-1757360133602-afff0a359d10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYXJlJTIwYm9vayUyMGNvbGxlY3Rpb258ZW58MXx8fHwxNzY0ODc1NzY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 4,
    title: 'Hermès Birkin Bag',
    description: 'Crocodile leather, limited edition',
    currentBid: 95000,
    bids: 31,
    endTime: '12h 45m',
    image: 'https://images.unsplash.com/photo-1591348278863-a8fb3887e2aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBoYW5kYmFnfGVufDF8fHx8MTc2NDgxNTA0M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 5,
    title: '1945 Château Margaux',
    description: 'Rare vintage wine, pristine condition',
    currentBid: 28000,
    bids: 18,
    endTime: '2d 1h',
    image: 'https://images.unsplash.com/photo-1758580815179-a35963ca52b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5lJTIwd2luZSUyMGJvdHRsZXN8ZW58MXx8fHwxNzY0ODc1NzY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  {
    id: 6,
    title: 'Rolex Daytona',
    description: 'Paul Newman edition, 1969',
    currentBid: 175000,
    bids: 37,
    endTime: '8h 20m',
    image: 'https://images.unsplash.com/photo-1680810897186-372717262131?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3YXRjaCUyMGF1Y3Rpb258ZW58MXx8fHwxNzY0ODc1NzYyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
]; 
export interface AuctionItem {
  _id: number;
  title: string;
  description: string;
  currentBid: number;
  bids: number;
  startingDate:Date,
  endingDate: Date,
  mode:string,
  image: string;   // or string if coming from API
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
      console.log(new Date(item.endingDate),new Date());
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
              hi
          </div>
          <div className="-mt-12 flex justify-end px-4 pointer-events-none z-10">
            <div className="px-3 py-1 bg-white/95 backdrop-blur-sm rounded-full flex items-center gap-1 pointer-events-auto shadow-lg border border-stone-200">
              <span className="text-neutral-800">{!hours && !minutes && !seconds?"END":`${hours}:${minutes}:${seconds}`}</span>
            </div>
          </div>
          
          <div className="p-6 pt-4">
            <h3 className="text-slate-900 mb-2">{item.title}</h3>
            <p className="text-slate-600 mb-4">{item.description}</p>
            
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
const url = import.meta.env.VITE_API_URL;

function App() {
  const [bids,setBids]= useState<AuctionItem[]>([]);
  const user = useUserStore((state)=>state.user)
  // ...

  React.useEffect(() => {
    const fetchBids = async () => {
      try {
        const res = await axios.get("https://csea-auction-site.onrender.com//api/bid/bids"); 
        setBids(res.data.auctions); 
      } catch (err) {
        console.error("Error fetching auctions:", err);
      }
    };
  
    fetchBids();
    
  }, []);
  console.log(bids);
  return (
    <>
    <div className='flex flex-col justify-between items-center text-sm md:text-lg bg-white'>
          <div className='flex h-70 w-full md:w-full md:h-150 justify-center items-center bg-blue-900'>
              <Carousel className="w-1/2 flex flex-col h-full md:w-3/4">
              <CarouselContent className=''>
                {Array.from({ length: 5 }).map((_, index) => (
                  <CarouselItem key={index} className='h-full'>
                    <div className="">
                      <Card className=''>
                        <CardContent className="">
                          <span className="font-semibold"><img src = "https://cdn.pixabay.com/photo/2025/11/24/11/00/burano-9973925_1280.jpg" className='object-contain w-full '/>{index + 1}</span>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>

          <div className="py-16 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-12 self-start">
                <h2 className="text-slate-900 mb-2">Hottest Items</h2>
                <p className="text-slate-600">Don't miss out on these trending auctions</p>
              </div>
              
              <div className="flex flex-col md:grid md:grid-cols-3  justify-center gap-4">
                {bids.map((card, index) => <ItemCard item = {card} key={index}  />)}
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
