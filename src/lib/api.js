import { supabase } from './supabase'

const V3_SOURCE_ID = 'bb093e7b-6584-43e9-a5ce-28fbf92c0673' // Cardbox - Original

export async function fetchCardboxLibrary() {
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, position')
    .eq('source_id', V3_SOURCE_ID)
    .eq('cardbox_enabled', true)
    .order('position')
  if (categoriesError) throw categoriesError

  const categoryIds = categories.map(c => c.id)

  const cards = []
  const PAGE_SIZE = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('cards')
      .select('id, category_id, label, position')
      .in('category_id', categoryIds)
      .order('position')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    cards.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  const labelsByCategory = {}
  cards.forEach(card => {
    if (!labelsByCategory[card.category_id]) labelsByCategory[card.category_id] = []
    labelsByCategory[card.category_id].push(card.label)
  })

  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    position: cat.position,
    cardCount: labelsByCategory[cat.id]?.length ?? 0,
    labels: labelsByCategory[cat.id] ?? [],
  }))
}

export async function fetchDeckCards(categoryIds) {
  const { data, error } = await supabase
    .from('cards')
    .select('id, category_id, label, image_url, position')
    .in('category_id', categoryIds)
    .order('position')
  if (error) throw error
  return data
}