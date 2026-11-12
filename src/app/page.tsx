
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ClassSchedule from "@/components/ClassSchedule";
import ClassMembers from "@/components/ClassMembers";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <ClassSchedule />
      <ClassMembers />
      <Footer />
    </main>
  );
}
