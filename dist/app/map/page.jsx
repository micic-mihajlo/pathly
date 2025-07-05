import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { MapContainer } from "@/components/map-container";
export default async function MapPage() {
    const { userId } = await auth();
    if (!userId) {
        redirect("/");
    }
    return (<div className="h-screen w-full">
      <MapContainer />
    </div>);
}
