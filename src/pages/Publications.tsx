/**
 * Publications Page
 * 
 * Showcases research papers, books, and other academic works by TECHSHASTRA members.
 * Includes a search functionality to filter publications by title, author, or description.
 * Data is fetched from the publicationStore.
 */
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, FileText, ExternalLink, Download, Search } from "lucide-react";
import { getAllPublications, Publication } from "@/lib/publicationStore";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const Publications = () => {
    const [publications, setPublications] = useState<Publication[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        setPublications(getAllPublications());
    }, []);

    const filteredPubs = publications.filter(pub =>
        pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pub.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pub.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <Navbar />

            <main className="container mx-auto px-4 py-24">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Research & Books
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Exploring the frontiers of technology through rigorous academic research and comprehensive literature.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="max-w-xl mx-auto mb-12 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search papers, authors, or topics..."
                        className="pl-10 h-12 rounded-full border-primary/20 bg-background/50 focus-visible:ring-primary shadow-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredPubs.length === 0 ? (
                        <div className="col-span-full text-center py-20">
                            <p className="text-xl text-muted-foreground">No publications found matching your search.</p>
                        </div>
                    ) : (
                        filteredPubs.map((pub) => (
                            <Card key={pub.id} className="group overflow-hidden border-2 hover:border-primary/40 transition-all duration-300 shadow-xl bg-card/50 backdrop-blur-sm">
                                <CardContent className="p-0">
                                    <div className="flex flex-col sm:flex-row h-full">
                                        {/* Icon Section */}
                                        <div className={`sm:w-32 flex items-center justify-center p-6 sm:p-0 ${pub.type === 'book' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'}`}>
                                            {pub.type === 'book' ? <Book className="w-12 h-12" /> : <FileText className="w-12 h-12" />}
                                        </div>

                                        {/* Content Section */}
                                        <div className="flex-1 p-6 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Badge variant={pub.type === 'book' ? 'secondary' : 'default'} className="uppercase text-[10px] tracking-widest px-2 py-0.5 rounded-sm">
                                                        {pub.type}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(pub.published_at).getFullYear()}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors leading-tight">
                                                    {pub.title}
                                                </h3>
                                                <p className="text-sm text-primary/80 font-medium mb-4 italic">
                                                    {pub.authors}
                                                </p>
                                                <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed mb-6">
                                                    {pub.description}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {pub.link_url && (
                                                    <a href={pub.link_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                                        <Button className="w-full rounded-lg gap-2" variant="outline">
                                                            View Source <ExternalLink className="w-4 h-4" />
                                                        </Button>
                                                    </a>
                                                )}
                                                {pub.file_url && (
                                                    <a href={pub.file_url} download={`${pub.title}.pdf`} className="flex-1">
                                                        <Button className="w-full rounded-lg gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white border-primary/20">
                                                            Download PDF <Download className="w-4 h-4" />
                                                        </Button>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Publications;
