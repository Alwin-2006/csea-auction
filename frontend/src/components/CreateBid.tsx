import { useState } from "react"
import { Card, CardTitle, CardContent } from "./ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "./ui/input";
import { Textarea } from "@/components/ui/textarea"
import { ArrowRightIcon, ArrowLeftIcon } from "lucide-react"
import { Button } from "./ui/button";
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useNavigate } from "react-router-dom"
import { useUserStore } from "@/store";


interface User {
    id: number,
    username: string,
    email: string,
    password: string,
    googleId: string,
    createdAt: Date;
}

interface DateAndTimePickerProps {
    type: 'opening' | 'closing';
    dateState: Date | undefined;
    setDateState: React.Dispatch<React.SetStateAction<Date | undefined>>;
    timeState: string;
    setTimeState: React.Dispatch<React.SetStateAction<string>>;
}

// Renamed and updated component to handle both date and time state correctly
function DateAndTimePicker({ type, dateState, setDateState, timeState, setTimeState }: DateAndTimePickerProps) {
    const [open, setOpen] = useState(false);
    const label = type === 'opening' ? 'Starting Date' : 'Ending Date';

    return (
        <div className="flex gap-4">
            <div className="flex flex-col gap-3">
                <Label htmlFor={`date-picker-${type}`} className="px-1">
                    Date
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            id={`date-picker-${type}`}
                            className="w-32 justify-between font-normal"
                        >
                            {dateState ? dateState.toLocaleDateString() : "Select date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={dateState}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                                setDateState(date);
                                setOpen(false)
                            }}
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex flex-col gap-3">
                <Label htmlFor={`time-picker-${type}`} className="px-1">
                    Time
                </Label>
                <Input
                    type="time"
                    id={`time-picker-${type}`}
                    step="1"
                    value={timeState} // Bind value to state
                    onChange={(e) => setTimeState(e.target.value)} // Update time state
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
            </div>
        </div>
    )
}

function CreateBid() {
    // Date and Time states
    const [closingDate, setClosingDate] = useState<Date | undefined>(undefined);
    const [openingDate, setOpeningDate] = useState<Date | undefined>(undefined);
    const [openingTime, setOpeningTime] = useState('00:00:00'); // Default time
    const [closingTime, setClosingTime] = useState('00:00:00'); // Default time

    const nav = useNavigate();
    const stored = useUserStore((state) => state.user);
    const token = localStorage.getItem('token');
    
    // Form data states
    const [currentStep, setCurrentStep] = useState(0);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [mode, setMode] = useState(0); // 0 for Standard, 1 for Dutch
    const [role, setRole] = useState(""); // For Select component value ('Standard' or 'Dutch')
    const [price, setPrice] = useState("");
    const [rate, setRate] = useState(""); // Pricedrop rate for Dutch auction

    const storedUser = stored;
    const user: User | null = storedUser ? stored : null;

    console.log("Current user:", user);
    console.log("Auth Token:", token ? 'present' : 'missing');

    // Helper function to combine Date and Time states
    const combineDateAndTime = (
        date: Date | undefined,
        time: string
      ): Date | undefined => {
        if (!date || !time) return undefined;
      
        const [hours, minutes, seconds = '0'] = time.split(':');
      
        const combined = new Date(date);
        combined.setHours(
          Number(hours),
          Number(minutes),
          Number(seconds),
          0
        );
      
        return combined; // JS will store this internally as UTC
      };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Validation Checks
        if (Number(price) < 5) {
            alert("Minimum Bid must be 5 rs");
            setPrice("");
            return;
        } else if (title.trim() === "") {
            alert("Title is required");
            return;
        }

        // 2. Combine Date and Time for Submission
        const finalOpeningDate = combineDateAndTime(openingDate, openingTime);
        const finalClosingDate = combineDateAndTime(closingDate, closingTime);
        
        if (!finalOpeningDate || !finalClosingDate) {
            alert("Please select both a valid starting and ending date/time.");
            return;
        }
        console.log(finalOpeningDate);
        console.log(finalClosingDate);
        // 3. Prepare Data
        const auctionData = {
            title: title,
            description: desc,
            currentBid: role === 'Dutch'?rate:Number(price),
            startingBid: Number(price),
            mode: role === "Dutch" ? "dutch" : "standard",
            seller: user ? user.id : null,
            startingDate: finalOpeningDate,
            endingDate: finalClosingDate,
            // rate: role === "Dutch" ? Number(rate) : undefined, // Include rate for Dutch auction
        };

        console.log("Auction Data to Submit:", auctionData);
        
        // TODO: Implement actual API call using axios or fetch here.
        // Example structure for API call:
        
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://csea-auction-site.onrender.com/api';
            const response = await fetch(`${API_URL}/api/bid/create-bid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(auctionData),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create bid');
            }

            // Handle success
            nav('/');

        } catch (error) {
            console.error("Submission Error:", error);
            alert(`Error creating auction: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        

    }


    return (
        <>
            <div className="flex flex-col justify-between gap-10">
                <h1 className="flex text-6xl font-bold justify-center">
                    Setup your Auction!
                </h1>
                
                {/* --- Navigation & Steps --- */}
                <div className="py-3 flex justify-center gap-4">
                    <Button disabled={currentStep === 0} variant="outline" size="icon" onClick={() =>
                        setCurrentStep(0)
                    } >
                        <ArrowLeftIcon />
                    </Button>

                    {currentStep === 0 ? (
                        <div className="flex justify-center gap-10">
                            <Card className="flex h-full text-4xl flex-col items-center p-5">
                                <CardTitle>Whats your product about?</CardTitle>
                                <CardContent className="flex flex-col justify-between gap-5 ">
                                    <div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="title" className="text-xl">Title</Label>
                                            <Input
                                                id="title"
                                                placeholder="Write your title here!"
                                                required
                                                onChange={(e) => { setTitle(e.target.value) }}
                                                value={title}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="photo-upload" className="text-xl">Photo</Label>
                                        <Input id="photo-upload" type="file" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="text-4xl p-5 h-full">
                                <CardTitle>Whats your Description?</CardTitle>
                                <Textarea className="h-full mt-4" value={desc} onChange={(e) => setDesc(e.target.value)} />
                            </Card>
                        </div>
                    ) : (
                        <div className="flex justify-center gap-5">
                            <Card>
                                <CardTitle className="flex h-full text-4xl flex-col items-center justify-center p-5">Mode</CardTitle>
                                <CardContent className="flex flex-col justify-between items-center gap-10">
                                    <Select onValueChange={(value) => {
                                        setRole(value);
                                        setMode(value === 'Standard' ? 0 : 1);
                                    }} value={role}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Mode of Auction" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="Standard">Standard</SelectItem>
                                                <SelectItem value="Dutch">Dutch Auction Mode</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-col gap-3">
                                            <Label>Starting price (minimum 5 rs)</Label>
                                            <Input
                                                placeholder="e.g., 500"
                                                inputMode="numeric"
                                                type="number"
                                                value={price}
                                                onChange={(e) => { setPrice(e.target.value) }}
                                            />
                                        </div>
                                        {
                                            role === "Dutch" ?
                                                <div className="flex flex-col gap-3">
                                                    <Label >Pricedrop rate</Label>
                                                    <Input
                                                        placeholder="e.g., 5"
                                                        type="number"
                                                        value={rate}
                                                        onChange={(e) => { setRate(e.target.value) }}
                                                    />
                                                </div> : <></>
                                        }
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardTitle className="flex h-full text-4xl flex-col items-center p-5">Auction Timeline</CardTitle>
                                <CardContent>
                                    <div className="flex flex-col gap-4 text-xl">
                                        <div className="flex flex-col gap-3">
                                            <h1 className="text-base font-semibold">Starting Date & Time:</h1>
                                            <DateAndTimePicker
                                                type="opening"
                                                dateState={openingDate}
                                                setDateState={setOpeningDate}
                                                timeState={openingTime}
                                                setTimeState={setOpeningTime}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <h1 className="text-base font-semibold">Ending Date & Time:</h1>
                                            <DateAndTimePicker
                                                type="closing"
                                                dateState={closingDate}
                                                setDateState={setClosingDate}
                                                timeState={closingTime}
                                                setTimeState={setClosingTime}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    
                    {
                        currentStep === 0 ?
                            <Button variant="outline" size="icon" onClick={() =>
                                setCurrentStep(1)
                            } >
                                <ArrowRightIcon />
                            </Button> :
                            <div>
                                <Button onClick={handleSubmit}>
                                    Submit
                                </Button>
                            </div>
                    }
                </div>
            </div>
        </>
    )
}

export default CreateBid