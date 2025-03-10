import React from "react";
import  Sidebar from "@/components/Sidebar";
import { FaSearch, FaPlus } from "react-icons/fa";
import {Card, CardContent} from "@/components/Card";
import Button from "@/components/Button";
import CalendarEvents from "@/components/CalendarEvents";

const HomePage = () => {
  return (
    <div className="flex min-h-screen overscroll-none overflow-hidden bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 space-y-6 ml-[80px] overflow-y-auto h-full" >
        {/* Top Navigation */}
        <header className="flex w-full items-center justify-between bg-white shadow-sm p-4 rounded-lg">
          <div className="flex items-center space-x-2 w-full max-w-md bg-gray-200 p-2 rounded-lg">
            <FaSearch className="text-gray-500" />
            <input
              type="text"
              placeholder="Search messages, files, and contacts"
              className="bg-transparent flex-1 outline-none"
            />
          </div>
          <Button className="bg-indigo-600 text-white flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-indigo-700">
            <FaPlus /> <span>New Message</span>
          </Button>
        </header>
        
        {/* Dashboard Content */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section */}
          <section className="lg:col-span-2 space-y-6">
            <h1 className="text-2xl font-semibold">Good morning, TeamConnect</h1>
            <p className="text-gray-600">Navigate the dashboard for updates and tasks.</p>

            {/* Tasks Section */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">My Tasks</h2>
                  <Button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    Upgrade Plan
                  </Button>
                </div>
                <table className="w-full mt-4">
                  <thead>
                    <tr className="text-left text-gray-500 uppercase text-sm border-b">
                      <th className="py-2">Task</th>
                      <th className="py-2">Who</th>
                      <th className="py-2">Due</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b">
                      <td className="py-2">Discussion on project milestones</td>
                      <td className="py-2">Travis</td>
                      <td className="py-2">Today</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Monthly progress report</td>
                      <td className="py-2">John</td>
                      <td className="py-2">Tomorrow</td>
                    </tr>
                    <tr>
                      <td className="py-2">Profile setup review</td>
                      <td className="py-2">Emma</td>
                      <td className="py-2">Today</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>
          
          {/* Right Section - Calendar */}
          <aside className="space-y-4">
            <CalendarEvents />
          </aside>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
