import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, UploadCloud } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useUserStore } from "@/store";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL;

function CreateBid() {
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const token = localStorage.getItem('token');

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startingBid: "",
        mode: "standard",
        pricedropRate: "",
        startingDate: new Date(),
        endingDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 7 days from now
        image: null as File | null,
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, image: e.target.files![0] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (Number(formData.startingBid) < 5) {
            alert("Minimum starting bid must be at least ₹5.");
            setIsLoading(false);
            return;
        }
        if (!formData.title.trim()) {
            alert("Title is required.");
            setIsLoading(false);
            return;
        }
        if (!user) {
            alert("You must be logged in to create an auction.");
            setIsLoading(false);
            return;
        }

        const submissionData = new FormData();
        submissionData.append('title', formData.title);
        submissionData.append('description', formData.description);
        submissionData.append('startingBid', formData.startingBid);
        submissionData.append('currentBid', formData.startingBid);
        submissionData.append('mode', formData.mode);
        submissionData.append('seller', String(user.id)); // Corrected to use _id
        submissionData.append('startingDate', formData.startingDate.toISOString());
        submissionData.append('endingDate', formData.endingDate.toISOString());
        
        if (formData.image) {
            submissionData.append('image', formData.image);
        }
        if (formData.mode === 'dutch' && formData.pricedropRate) {
            submissionData.append('pricedropRate', formData.pricedropRate);
        }

        try {
            const response = await fetch(`${API_URL}/api/bid/create-bid`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: submissionData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create auction.');
            }
            navigate('/');
        } catch (error) {
            console.error("Submission Error:", error);
            alert(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-12">
            <Card className="max-w-4xl mx-auto ">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-amber-400 tracking-tight">Create New Auction</CardTitle>
                    <CardDescription>Fill out the details below to list your new item for auction.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-8" onSubmit={handleSubmit}>
                        {/* Item Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Item Details</h3>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., Antique Wooden Chair" required />
                                </div>
                                <div className="space-y-2 md:row-span-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea id="description" value={formData.description} onChange={handleInputChange} placeholder="Describe your item in detail..." className="min-h-[120px]" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="image-upload">Item Image</Label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary">
                                        <label htmlFor="image-upload" className="cursor-pointer w-full">
                                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-2 text-sm text-gray-600">
                                                {formData.image ? `Selected: ${formData.image.name}` : "Click to upload an image"}
                                            </p>
                                            <Input id="image-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Auction Settings Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Auction Settings</h3>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="mode">Auction Mode</Label>
                                    <Select value={formData.mode} onValueChange={(value) => setFormData(p => ({ ...p, mode: value }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standard">Standard</SelectItem>
                                            <SelectItem value="dutch">Dutch Auction</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="startingBid">Starting Bid (₹)</Label>
                                    <Input id="startingBid" type="number" value={formData.startingBid} onChange={handleInputChange} placeholder="e.g., 500" required min="5" />
                                </div>
                                {formData.mode === 'dutch' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="pricedropRate">Price Drop Rate (₹ per hour)</Label>
                                        <Input id="pricedropRate" type="number" value={formData.pricedropRate} onChange={handleInputChange} placeholder="e.g., 50" required={formData.mode === 'dutch'} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timeline Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Timeline</h3>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="space-y-2">
                                    <Label>Starting Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.startingDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.startingDate ? format(formData.startingDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={formData.startingDate} onSelect={(date) => date && setFormData(p => ({ ...p, startingDate: date }))} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label>Ending Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !formData.endingDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.endingDate ? format(formData.endingDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={formData.endingDate} onSelect={(date) => date && setFormData(p => ({ ...p, endingDate: date }))} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <Button type="submit" onClick={handleSubmit} disabled={isLoading} className="ml-auto">
                        {isLoading ? "Creating..." : "Create Auction"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

export default CreateBid;
