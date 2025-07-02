import { Button } from "@/components/ui/button";

export default function InviteFriends() {
  const link = "https://coinbitclub.com.br/r/SEULINK123";
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Convide Amigos</h1>
      <div className="bg-card rounded-xl shadow border border-border p-8 max-w-xl">
        <p className="mb-4">
          Compartilhe seu link e ganhe bônus em cada indicação que virar cliente!
        </p>
        <div className="flex items-center mb-6">
          <input
            type="text"
            value={link}
            readOnly
            className="w-full p-2 rounded bg-background border border-border font-mono"
          />
          <Button className="ml-3">Copiar</Button>
        </div>
        <div className="text-muted-foreground text-sm">
          Você ganha <span className="text-cyan-400 font-bold">50%</span> da 1ª mensalidade de cada novo cliente indicado.
        </div>
      </div>
    </div>
  );
}
