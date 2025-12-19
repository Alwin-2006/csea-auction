import React from 'react';
import { Clock, TrendingUp, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useBidStore } from '@/bidStore';
import { useUserStore } from '@/store';
import { Link } from 'react-router-dom';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Separator } from '@radix-ui/react-select';
import { Button } from './ui/button';

const myBids = [
  {
    id: 1,
    title: 'Diamond Necklace',
    image: 'https://images.unsplash.com/photo-1481980235850-66e47651e431?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWFtb25kJTIwamV3ZWxyeXxlbnwxfHx8fDE3NjQ4MjQ3MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    myBid: 85000,
    currentBid: 85000,
    isLeading: true,
    endTime: '4h 32m',
    status: 'active',
  },
  {
    id: 2,
    title: 'First Edition Book Set',
    image: 'https://images.unsplash.com/photo-1757360133602-afff0a359d10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYXJlJTIwYm9vayUyMGNvbGxlY3Rpb258ZW58MXx8fHwxNzY0ODc1NzY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    myBid: 425000,
    currentBid: 450000,
    isLeading: false,
    endTime: '6h 15m',
    status: 'outbid',
  },
  {
    id: 3,
    title: 'Rolex Daytona',
    image: 'https://images.unsplash.com/photo-1680810897186-372717262131?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3YXRjaCUyMGF1Y3Rpb258ZW58MXx8fHwxNzY0ODc1NzYyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    myBid: 175000,
    currentBid: 175000,
    isLeading: true,
    endTime: '8h 20m',
    status: 'active',
  },
  {
    id: 4,
    title: 'Victorian Writing Desk',
    image: 'https://images.unsplash.com/photo-1544691560-fc2053d97726?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbnRpcXVlJTIwZnVybml0dXJlfGVufDF8fHx8MTc2NDg0NDMxNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    myBid: 11000,
    currentBid: 11000,
    isLeading: true,
    endTime: 'Ended',
    status: 'past',
  },
  {
    id: 5,
    title: 'Hermès Birkin Bag',
    image: 'https://images.unsplash.com/photo-1591348278863-a8fb3887e2aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBoYW5kYmFnfGVufDF8fHx8MTc2NDgxNTA0M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    myBid: 90000,
    currentBid: 95000,
    isLeading: false,
    endTime: 'Ended',
    status: 'past',
  },
];

export function MyBids() {
  const bids = useBidStore((s)=>s.bids);
  const user = useUserStore((s)=>s.user);
  const ongoing = bids.filter(ele => ele.status != 'completed'&& ele.seller._id != String(user?.id));
  const finished = bids.filter(ele => ele.status === 'completed'&& ele.seller._id != String(user?.id));
  const hasOutbid = bids.some(auction => auction.currentBid > auction.bidHistory.find((ele)=>ele.bidder == String(user?.id))?.amount );
  const myAuctions = bids.filter(ele=> ele.seller._id === String(user?.id));
  console.log("bids is",bids);

  const salutations = ["Hello","Sup"];

  return (
    <div className="bg-white rounded-4xl p-10">
      <h1 className='flex flex-col gap-5 md:gap-5 items-start font-bold self-center max-w-7xl mx-auto  px-4 sm:px-6 lg:px-8 md:text-[150px] my-5 text-amber-400'>
        <p className='m-0  text-7xl md:text-[100px]'>{salutations[Math.floor(Math.random() * salutations.length)]},</p> 
        <p className='w-fit h-fit text-7xl md:text-[150px]'>{user?.username.split(" ")[0]}</p>
      </h1>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Outbid Warning */}
        {hasOutbid && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <div className="text-amber-900">You've been outbid!</div>
              <p className="text-amber-700">You have ongoing auctions where you're no longer in the lead. Review your bids below.</p>
            </div>
          </div>
        )}
        <Tabs defaultValue="ongoingAuctions">
        <TabsList className='flex self-center '>
          <TabsTrigger value="ongoingAuctions">Ongoing Bids</TabsTrigger>
          <TabsTrigger value="pastBids">Past Bids</TabsTrigger>
          <TabsTrigger value="myAuctions">My Auctions</TabsTrigger>
        </TabsList>
        <Separator />
          <TabsContent value ="ongoingAuctions" >
              {/* Active Bids */}
              {ongoing.length > 0 ? (
                <div className="mb-12">
                  <h3 className="text-slate-900 mb-6 text-4xl">Ongoing Bids</h3>
                  <div className="space-y-4">
                    {ongoing.map((bid) => (
                      <div
                        key={bid._id}
                        className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                      > 
                        <Link to={`/bid/${bid._id}`}>
                        <div className="flex gap-6">
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-slate-900 mb-2">{bid.title}</h4>
                                {bid.currentBid === bid.bidHistory.find((ele)=>ele.bidder == String(user?.id))?.amount ? (
                                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Winning</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full">
                                    <XCircle className="w-4 h-4" />
                                    <span>Outbid</span>
                                  </div>
                                )}
                              </div>
                              {/*<div className="flex items-center gap-2 text-slate-600">
                                <Clock className="w-4 h-4" />
                                <span>{bid.endTime}</span>
                              </div>*/}
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <div className="text-slate-500 mb-1">Your Bid</div>
                                <div className="text-slate-900">Rs {bid.bidHistory
        .filter(bid => bid.bidder === String(user?.id))
        .reduce( (max, bid) => bid.amount > max.amount ? bid : max,{ amount: -1 } as typeof bid.bidHistory[0]).amount}</div>
                              </div>
                              <div>
                                <div className="text-slate-500 mb-1">Current Bid</div>
                                <div className="text-amber-600">
                                  Rs {bid.currentBid}
                                </div>
                              </div>
                            </div>
                            {!bid && (
                              <button className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                                Increase Bid
                              </button>
                            )}
                          </div>
                        </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ):
              <div className='text-4xl my-10 h-screen flex  justify-center'>
                  You aren't participating in any ongoing auctions!
              </div>
              }
            </TabsContent>
            <TabsContent value='pastBids'>
            {finished.length > 0 ? (
                <div className="mb-12">
                  <h3 className="text-slate-900 mb-6 text-4xl">Past Bids</h3>
                  <div className="space-y-4">
                    {finished.map((bid) => (
                      <div
                        key={bid._id}
                        className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                      > 
                        <Link to={`/bid/${bid._id}`}>
                        <div className="flex gap-6">
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-slate-900 mb-2">{bid.title}</h4>
                                {bid.currentBid === bid.bidHistory.find((ele)=>ele.bidder == String(user?.id))?.amount ? (
                                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Won</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full">
                                    <XCircle className="w-4 h-4" />
                                    <span>Lost</span>
                                  </div>
                                )}
                              </div>
                              {/*<div className="flex items-center gap-2 text-slate-600">
                                <Clock className="w-4 h-4" />
                                <span>{bid.endTime}</span>
                              </div>*/}
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <div className="text-slate-500 mb-1">Your Bid</div>
                                <div className="text-slate-900">Rs {bid.bidHistory
        .filter(bid => bid.bidder === String(user?.id))
        .reduce( (max, bid) => bid.amount > max.amount ? bid : max,{ amount: -1 } as typeof bid.bidHistory[0]).amount}</div>
                              </div>
                              <div>
                                <div className="text-slate-500 mb-1">Current Bid</div>
                                <div className="text-amber-600">
                                  Rs {bid.currentBid}
                                </div>
                              </div>
                            </div>
                            {!bid && (
                              <button className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                                Increase Bid
                              </button>
                            )}
                          </div>
                        </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ):
              <div className='text-4xl my-10 h-screen flex  justify-center'>
                  You don't have any past auctions
              </div>
              }
            </TabsContent>
            <TabsContent value= "myAuctions">
            {myAuctions.length > 0 ? (
                <div className="mb-12">
                  <h3 className="text-slate-900 mb-6 text-4xl">Your Auctions</h3>
                  <div className="space-y-4">
                    {myAuctions.map((bid) => (
                      <div
                        key={bid._id}
                        className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                      > 
                        <Link to={`/bid/${bid._id}`}>
                        <div className="flex gap-6">
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-slate-900 mb-2">{bid.title}</h4>
                                
                              </div>
                              {/*<div className="flex items-center gap-2 text-slate-600">
                                <Clock className="w-4 h-4" />
                                <span>{bid.endTime}</span>
                              </div>*/}
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <div className="text-slate-500 mb-1">Current Bid</div>
                                <div className="text-amber-600">
                                  Rs {bid.currentBid}
                                </div>
                              </div>
                            </div>
                            {!bid && (
                              <button className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                                Increase Bid
                              </button>
                            )}
                          </div>
                        </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ):  
              <div className='text-4xl my-10 h-screen flex flex-col gap-10 items-center'>
                <div className='flex flex-row items-center'>No auctions?<img src="https://cdn3.emoji.gg/emojis/9174-no-bitches-megamind.png" width="64px" height="64px" alt="no_bitches_megamind" /></div>
                <div className='flex items-center'><Button><Link to="/new-bids">Create Auction</Link></Button></div>
              </div>
              }
            </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

export default MyBids;