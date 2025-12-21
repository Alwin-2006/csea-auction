import { Link } from "react-router-dom"
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom"
import { useUserStore } from "../store.ts";
import { useEffect } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"


interface User {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
  // add fields if needed
}


const Navbar = () => {
    const token = localStorage.getItem('token');
    const stored = useUserStore.getState().user;
    const clearUser = useUserStore((state) => state.clearUser);
    const user = stored ? stored : null;
    const nav = useNavigate();
    const handleLogout = () =>{
        localStorage.removeItem('token');
        clearUser();
        nav('/login');
    }
    return  (
        <nav className="w-full bg-white text-gray-500">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            
            {/* Logo */}
            <Link to="/" className="text-xl font-semibold">
              SALE HOUSE
            </Link>
            {/* Desktop Links */}
            <div className="hidden md:flex space-x-6">
              <Link to="/bids" className=" hover:text-amber-500 ">
                Dashboard
              </Link>
              <Link to={user?"/new-bids":"/login"} className=" hover:text-amber-500 ">
                  New Auction
              </Link>
            </div>
            <div className="hidden md:flex space-x-6 items-center">
                    {
                      user ?
                       <div className="flex items-center justify-between gap-3">
                          <div>
                          <Avatar>
                            <AvatarImage src={user.profilePicture}   referrerPolicy="no-referrer"/>
                            <AvatarFallback>{user.username[0]}</AvatarFallback>
                          </Avatar>
                          </div>
                          <Button className="bg-amber-500 p-3 rounded-2xl text-white" onClick = {handleLogout}>Logout</Button>
                        </div>:
                      <div className="flex gap-3">
                    <Link to= "/login" className="bg-amber-500 p-3 rounded-2xl text-white">
                        Login
                    </Link>
                    <Link to= "/sign-up" className="bg-amber-500 p-3 rounded-2xl text-white">
                        Sign up
                    </Link>
                    </div>
                  }
            </div>
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger className="md:hidden">
                <Menu className="h-6 w-6" />
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
    
                <div className="flex flex-col mt-6 space-y-4">
                  
                  <Link to="/bids" className="text-lg">
                    Dashboard
                  </Link>
                  <Link to="/new-bids" className="text-lg">
                    New Auction
                  </Link>
                  <Link to="/contact" className="text-lg">
                    Contact
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      );
}

export default Navbar