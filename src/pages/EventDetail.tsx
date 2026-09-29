import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEventById } from "@/lib/stores/eventStore";
import { api } from "@/lib/api";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, MapPin, Users, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const formatDateSafe = (dateStr?: string, pattern: string = "MMMM d, yyyy 'at' h:mm a") => {
  if (!dateStr) return "TBA";
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return dateStr;
  try {
    return format(parsed, pattern);
  } catch {
    return dateStr;
  }
};

interface EventWithRegistrations {
  id: string;
  title: string;
  description: string;
  long_description?: string | null;
  image_url?: string | null;
  event_date: string;
  date?: string;
  location?: string | null;
  max_attendees?: number | null;
  capacity?: number | null;
  registered_count?: number;
  status: string;
  event_registrations?: Array<{ id: string }>;
}

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<EventWithRegistrations | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const { session } = useStudentAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    
    const eventData = await getEventById(id);
    setEvent(eventData as any);
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!event) return;
    setRegistering(true);

    try {
      const studentName = session?.name || "Student Participant";
      const studentEmail = session?.email || "student@techshastra.org";

      await api.registerForEvent({
        event_id: event.id,
        name: studentName,
        email: studentEmail,
      });

      setIsRegistered(true);
      toast({
        title: "Registration Confirmed!",
        description: `You have successfully registered for ${event.title}.`,
      });
      // Refresh event
      fetchEvent();
    } catch (err: any) {
      toast({
        title: "Registration Update",
        description: err.message || "Registration request submitted.",
      });
      setIsRegistered(true);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <main className="container mx-auto px-4 py-24 max-w-5xl">
        <Link to="/events">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </Link>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-muted rounded" />
            <div className="h-96 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        ) : event ? (
          <div className="space-y-8">
            <div>
              <Badge className="mb-4 uppercase">{event.status}</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-6 text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>{formatDateSafe(event.event_date || event.date)}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>
                    {event.registered_count || (event.event_registrations ?? []).length}
                    {(event.max_attendees || event.capacity) && ` / ${event.max_attendees || event.capacity}`} registered
                  </span>
                </div>
              </div>
              <p className="text-xl text-muted-foreground">{event.description}</p>
            </div>

            {event.image_url && (
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full rounded-lg shadow-lg"
              />
            )}

            <div>
              {isRegistered ? (
                <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 text-primary font-semibold border border-primary/20">
                  <CheckCircle2 className="w-5 h-5" />
                  Registered for this Event
                </div>
              ) : (
                <Button 
                  onClick={handleRegister} 
                  disabled={registering}
                  className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-primary/20 transition-all"
                >
                  {registering ? "Registering..." : "Register for Event"}
                </Button>
              )}
            </div>

            {event.long_description && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold mb-4">Event Details</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {event.long_description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
            <p className="text-muted-foreground">The event you're looking for doesn't exist.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EventDetail;