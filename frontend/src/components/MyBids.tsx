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

export function MyBids() {
  const bids = useBidStore((s) => s.bids) || []; // Ensure bids is always an array
  const user = useUserStore((s) => s.user);

  // Defensive filtering logic
  const ongoing = bids.filter(ele => ele && ele.status != 'completed' && ele.seller?._id !== String(user?.id));
  const finished = bids.filter(ele => ele && ele.status === 'completed' && ele.seller?._id !== String(user?.id));
  const myAuctions = bids.filter(ele => ele && ele.seller?._id === String(user?.id));

  const hasOutbid = bids.some(auction => {
    if (!auction || !auction.bidHistory || auction.status === 'completed'||auction.seller._id === String(user?.id)) return false;
    const myBidsInAuction = auction.bidHistory.filter(b => b.bidder === String(user?.id));
    if (myBidsInAuction.length === 0) return false;
    const myHighestBid = Math.max(...myBidsInAuction.map(b => b.amount));
    return auction.currentBid > myHighestBid;
  });


  const salutations = ["Hello", "Welcome"];

  const findMyHighestBid = (bidHistory: any[]) => {
    if (!bidHistory || !user) return { amount: 0 };
    const myBids = bidHistory.filter(b => b.bidder === String(user.id));
    if (myBids.length === 0) return { amount: 0 };
    return myBids.reduce((max, bid) => bid.amount > max.amount ? bid : max, myBids[0]);
  };
  
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
              {ongoing.map((bid) => {
                const myHighestBid = findMyHighestBid(bid.bidHistory);
                const isWinning = bid.currentBid === myHighestBid.amount;
                
                return (
                  <div key={bid._id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <Link to={`/bid/${bid._id}`}>
                      <div className="flex gap-6">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-slate-900 mb-2">{bid.title}</h4>
                              {myHighestBid.amount == bid.currentBid ? (
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
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <div className="text-slate-500 mb-1">Your Bid</div>
                              <div className="text-slate-900">Rs {myHighestBid.amount}</div>
                            </div>
                            <div>
                              <div className="text-slate-500 mb-1">Current Bid</div>
                              <div className="text-amber-600">Rs {bid.currentBid}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                )
              })}
              {ongoing.length === 0 && (
                <div className='text-4xl my-10 h-screen flex  justify-center'>
                    You aren't participating in any ongoing auctions!
                </div>
              )}
            </TabsContent>
            <TabsContent value='pastBids'>
              {finished.map((bid) => {
                  const myHighestBid = findMyHighestBid(bid.bidHistory);

                  return (
                    <div key={bid._id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <Link to={`/bid/${bid._id}`}>
                        <div className="flex gap-6">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-slate-900 mb-2">{bid.title}</h4>
                                {myHighestBid.amount == bid.currentBid  ? (
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
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <div className="text-slate-500 mb-1">Your Bid</div>
                                <div className="text-slate-900">Rs {myHighestBid.amount}</div>
                              </div>
                              <div>
                                <div className="text-slate-500 mb-1">Winning Bid</div>
                                <div className="text-amber-600">Rs {bid.currentBid}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )
              })}
              {finished.length === 0 && (
                <div className='text-4xl my-10 h-screen flex  justify-center'>
                    You don't have any past auctions
                </div>
              )}
            </TabsContent>
            <TabsContent value= "myAuctions">
              {myAuctions.length > 0 ? (
                  <div className="mb-12">
                    <h3 className="text-slate-900 mb-6 text-4xl">Your Auctions</h3>
                    <div className="space-y-4">
                      {myAuctions.map((bid) => (
                        <div key={bid._id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"> 
                          <Link to={`/bid/${bid._id}`}>
                            <div className="flex gap-6">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h4 className="text-slate-900 mb-2">{bid.title}</h4>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <div className="text-slate-500 mb-1">Current Bid</div>
                                    <div className="text-amber-600">Rs {bid.currentBid}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : ( 
                <div className='text-4xl my-10 h-screen flex flex-col gap-10 items-center'>
                  <div className='flex flex-row items-center'>No auctions?<img src="https://cdn3.emoji.gg/emojis/9174-no-bitches-megamind.png" width="64px" height="64px" alt="no_bitches_megamind" /></div>
                  <div className='flex items-center'><Button><Link to="/new-bids">Create Auction</Link></Button></div>
                </div>
              )}
            </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

export default MyBids;