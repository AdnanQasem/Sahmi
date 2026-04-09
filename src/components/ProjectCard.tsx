import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Users, Clock } from "lucide-react";

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  category: string;
  founder: string;
  image: string;
  goal: number;
  raised: number;
  supporters: number;
  daysLeft: number;
  verified: boolean;
}

const ProjectCard = ({ project }: { project: ProjectData }) => {
  const percentFunded = Math.min(Math.round((project.raised / project.goal) * 100), 100);

  return (
    <motion.div 
      whileHover={{ y: -10, transition: { duration: 0.3, ease: "easeOut" } }}
      className="group flex flex-col h-full overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:shadow-2xl hover:border-primary/20"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={project.image}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3">
          <Badge variant="muted" className="bg-card/90 text-foreground backdrop-blur-sm">
            {project.category}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-1 line-clamp-1 text-lg font-semibold text-foreground">
          {project.title}
        </h3>
        <p className="mb-1 text-xs text-muted-foreground">by {project.founder}</p>
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>

        <div className="mt-auto">
          <div className="mb-4 pt-1">
            <div className="mb-2 flex items-end justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold leading-none tracking-tight text-foreground">${project.raised.toLocaleString()}</span>
                <span className="text-xs font-medium text-muted-foreground">of ${project.goal.toLocaleString()}</span>
              </div>
              <span className="text-sm font-bold text-primary">
                {percentFunded}%
              </span>
            </div>
            
            {/* Custom Fintech Progress Bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/50">
              <div 
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out" 
                style={{ width: `${percentFunded}%` }}
              />
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {project.supporters} supporters
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {project.daysLeft} days left
            </span>
          </div>

          <Button size="sm" className="w-full" asChild>
            <Link to={`/projects/${project.id}`}>View Project</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
