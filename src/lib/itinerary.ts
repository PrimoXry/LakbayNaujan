import { supabase } from './supabase';
import type { TouristSpot } from './types';

export type ItineraryItem = { id?: string; spot_id: string; position: number; visited: boolean; visited_at?: string | null; spot?: TouristSpot };
export type Itinerary = { id: string; user_id: string; title: string; status: 'planning' | 'in_progress' | 'completed'; created_at: string; updated_at: string; items: ItineraryItem[] };
export type Review = { id: string; user_id: string; itinerary_id: string; tourist_spot_id: string; rating: number; comment: string; created_at: string; updated_at: string };

export async function loadItineraries(userId: string): Promise<Itinerary[]> {
  const { data, error } = await supabase.from('itineraries').select('*, itinerary_items(*, spot:tourist_spots(*))').eq('user_id', userId).order('updated_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Array<Itinerary & { itinerary_items?: ItineraryItem[] }>).map(item => ({ ...item, items: [...(item.itinerary_items ?? item.items ?? [])].sort((a, b) => a.position - b.position) }));
}

export async function saveItinerary(userId: string, itinerary: Pick<Itinerary, 'id' | 'title' | 'status'> | null, items: ItineraryItem[]) {
  const title = itinerary?.title?.trim() || 'My Naujan adventure';
  const status = items.length > 0 && items.every(item => item.visited) ? 'completed' : items.some(item => item.visited) ? 'in_progress' : 'planning';
  const { data: saved, error } = itinerary?.id
    ? await supabase.from('itineraries').update({ title, status }).eq('id', itinerary.id).eq('user_id', userId).select().single()
    : await supabase.from('itineraries').insert({ user_id: userId, title, status }).select().single();
  if (error) throw error;
  const id = saved.id as string;
  const { error: removeError } = await supabase.from('itinerary_items').delete().eq('itinerary_id', id);
  if (removeError) throw removeError;
  if (items.length) {
    const { error: itemError } = await supabase.from('itinerary_items').insert(items.map((item, position) => ({ itinerary_id: id, spot_id: item.spot_id, position, visited: item.visited, visited_at: item.visited ? item.visited_at ?? new Date().toISOString() : null })));
    if (itemError) throw itemError;
  }
  return id;
}

export async function loadReviews(spotId: string) {
  const { data, error } = await supabase.from('reviews').select('*').eq('tourist_spot_id', spotId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function saveReview(userId: string, itineraryId: string, spotId: string, rating: number, comment: string) {
  const payload = { user_id: userId, itinerary_id: itineraryId, tourist_spot_id: spotId, rating, comment: comment.trim() };
  const { data, error } = await supabase.from('reviews').upsert(payload, { onConflict: 'user_id,itinerary_id,tourist_spot_id' }).select().single();
  if (error) throw error;
  return data as Review;
}

function pdfText(value: string) { return value.replace(/\\/g, '\\\\').replace(/[()]/g, value => `\\${value}`).replace(/[^\x20-\x7E]/g, '?'); }
function downloadPdf(title: string, subtitle: string, lines: string[], filename: string) {
  const pages: string[][] = []; let page: string[] = []; let y = 760;
  const add = (line: string, size = 10) => { if (y < 55) { pages.push(page); page = []; y = 800; } page.push(`BT /F1 ${size} Tf 55 ${y} Td (${pdfText(line)}) Tj ET`); y -= size === 18 ? 30 : 18; };
  add('LAKBAY NAUJAN', 18); add(title, 13); add(subtitle, 9); y -= 15; lines.forEach(line => add(line)); add('Explore. Discover. Experience Naujan.', 8); pages.push(page);
  const objects: string[] = []; const pageIds: number[] = []; const contentIds: number[] = []; objects.push('<< /Type /Catalog /Pages 2 0 R >>'); objects.push('');
  pages.forEach(commands => { const stream = commands.join('\n'); objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`); contentIds.push(objects.length); objects.push(''); pageIds.push(objects.length); });
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  const fontId = objects.length + 1; pageIds.forEach((pageId, index) => { objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`; });
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  let pdf = '%PDF-1.4\n'; const offsets: number[] = [0]; objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; }); const xref = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`; offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; }); pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const blob = new Blob([pdf], { type: 'application/pdf' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
export function downloadItineraryPdf(itinerary: Itinerary, spots: TouristSpot[]) {
  const lines = [`Total destinations: ${itinerary.items.length}`]; itinerary.items.forEach((item, index) => { const spot = spots.find(value => value.id === item.spot_id) ?? item.spot; if (spot) { lines.push(`${item.visited ? '[x]' : '[ ]'} ${index + 1}. ${spot.name} - ${spot.category}`); lines.push(`    ${spot.address} - ${spot.description.slice(0, 85)}`); } }); downloadPdf('My Travel Itinerary', `Generated ${new Date().toLocaleDateString()} - ${itinerary.title}`, lines, 'Lakbay-Naujan-My-Itinerary.pdf');
}
export function downloadMasterChecklist(spots: TouristSpot[]) {
  const lines: string[] = []; [...new Set(spots.map(spot => spot.category))].sort().forEach(category => { lines.push(category); spots.filter(spot => spot.category === category).forEach(spot => lines.push(`[ ] ${spot.name} - ${spot.address}`)); }); downloadPdf('Complete Destination Checklist', `All published destinations - Generated ${new Date().toLocaleDateString()}`, lines, 'Lakbay-Naujan-Complete-Checklist.pdf');
}
