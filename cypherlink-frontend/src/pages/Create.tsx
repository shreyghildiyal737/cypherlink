import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
const groups = [
  {
    title: "Start something",
    items: [
      { label: "Project", path: "#" },
      { label: "Open Cypher", path: "#" },
      { label: "Venue Cypher", path: "#" },
      { label: "Community Session", path: "#" },
    ],
  },
  {
    title: "Share something",
    items: [
      { label: "Drop Clip", path: "#" },
      { label: "Go Live", path: "#" },
      { label: "Open Collaboration Call", path: "#" },
    ],
  },
  {
    title: "Learn together",
    items: [
      { label: "Free Learning Session", path: "#" },
      { label: "Beginner Jam", path: "#" },
      { label: "Teach for Free", path: "#" },
    ],
  },
];
export default function Create() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Badge tone="orange">What are you trying to start?</Badge>
      <h1 className="mt-4 text-4xl font-black md:text-6xl">
        Create without killing the momentum.
      </h1>
      <p className="mt-3 max-w-2xl text-white/60">
        Progressive flows. No giant forms. Creation should feel like initiating
        movement.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {groups.map((group) => (
          <section
            key={group.title}
            className="rounded-[2rem] border border-white/10 bg-panel p-5"
          >
            <h2 className="text-xl font-black">{group.title}</h2>
            <div className="mt-5 space-y-3">
              {group.items.map((item) => (
                <Button
                  key={item.label}
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
