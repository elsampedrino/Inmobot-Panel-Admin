import { useEffect, useState, type ReactNode } from "react";
import {
  Users, MessageCircle, Building2, RefreshCw,
  AlertTriangle, CheckCircle, Star,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import { getSession } from "../lib/auth";
import { ESTADOS_LEAD } from "../types/leads";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ClienteKPIs {
  leads_mes: number;
  leads_nuevos: number;
  conversaciones_mes: number;
  propiedades_activas: number;
  tokens_mes: number;
}

interface LeadResumen {
  fecha: string;
  nombre: string | null;
  telefono: string | null;
  propiedad_titulo: string | null;
  estado: string;
}

interface ActividadBot {
  conversaciones_mes: number;
  promedio_diario: number;
}

interface PropiedadResumen {
  id_item: string;
  titulo: string;
  tipo: string;
  categoria: string;
  activo: boolean;
  destacado: boolean;
}

interface AlertaCliente {
  tipo: string;
  mensaje: string;
}

interface ClienteDashboardResponse {
  empresa_nombre: string;
  kpis: ClienteKPIs;
  leads_recientes: LeadResumen[];
  actividad_bot: ActividadBot;
  propiedades: PropiedadResumen[];
  alertas: AlertaCliente[];
  generado_en: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function EstadoBadge({ estado }: { estado: string }) {
  const def = ESTADOS_LEAD.find(e => e.value === estado);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${def?.color ?? "bg-gray-100 text-gray-600"}`}>
      {def?.label ?? estado}
    </span>
  );
}

// ─── Componentes ──────────────────────────────────────────────────────────────

function KPICard({ icon, label, value, sub }: {
  icon: ReactNode; label: string; value: string | number; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className="p-2.5 rounded-lg bg-brand-50 text-brand-600 shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ClienteDashboardPage() {
  const [data, setData]       = useState<ClienteDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const session = getSession();
  const nombreUsuario = session?.usuario.nombre ?? session?.empresa.nombre ?? "Bienvenido";

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ClienteDashboardResponse>("/cliente/dashboard");
      setData(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-gray-400 text-sm">
        Cargando dashboard...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 text-sm rounded-lg p-4">{error}</div>
      </div>
    );
  }

  const { kpis, leads_recientes, actividad_bot, propiedades, alertas, generado_en } = data;

  return (
    <div className="p-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {nombreUsuario}</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {data.empresa_nombre} · actualizado {fmtFecha(generado_en)}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={<Users       size={18}/>} label="Leads del mes"       value={kpis.leads_mes} />
        <KPICard icon={<Users       size={18}/>} label="Leads nuevos"        value={kpis.leads_nuevos} sub="Sin contactar" />
        <KPICard icon={<MessageCircle size={18}/>} label="Conversaciones"    value={kpis.conversaciones_mes} sub="(Mes actual)" />
        <KPICard icon={<Building2   size={18}/>} label="Propiedades activas" value={kpis.propiedades_activas} />
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {alertas.map((a, i) => (
            <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle size={15} className="text-yellow-500 shrink-0" />
              <p className="text-sm text-yellow-800">{a.mensaje}</p>
            </div>
          ))}
        </div>
      )}

      {alertas.length === 0 && (
        <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 rounded-xl px-4 py-3">
          <CheckCircle size={16}/> Todo en orden este mes
        </div>
      )}

      {/* Leads + Actividad bot — dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Leads recientes — 2/3 del ancho */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Leads recientes</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Propiedad</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads_recientes.map((l, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtFecha(l.fecha)}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{l.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{l.telefono ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[180px] truncate" title={l.propiedad_titulo ?? undefined}>
                      {l.propiedad_titulo ?? "—"}
                    </td>
                    <td className="px-4 py-3"><EstadoBadge estado={l.estado} /></td>
                  </tr>
                ))}
                {leads_recientes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                      Sin leads registrados este mes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actividad del bot — 1/3 del ancho */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Actividad del bot</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Conversaciones este mes</p>
              <p className="text-3xl font-bold text-gray-900">{actividad_bot.conversaciones_mes}</p>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Promedio diario</p>
              <p className="text-2xl font-bold text-gray-900">{actividad_bot.promedio_diario}</p>
              <p className="text-xs text-gray-400 mt-0.5">conversaciones por día</p>
            </div>
            {actividad_bot.conversaciones_mes === 0 && (
              <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                El bot aún no registró conversaciones este mes.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Propiedades publicadas */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Propiedades publicadas</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Título</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Operación</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Destacada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {propiedades.map(p => (
                <tr key={p.id_item} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.titulo}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{p.tipo || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{p.categoria || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {p.activo ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.destacado
                      ? <Star size={14} className="mx-auto text-yellow-400 fill-yellow-400" />
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>
                </tr>
              ))}
              {propiedades.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Sin propiedades cargadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
