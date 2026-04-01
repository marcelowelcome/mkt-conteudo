// Script de validação — testa conexão Supabase, tabelas e auth

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function validate() {
  console.log('\n=== VALIDAÇÃO SUPABASE ===\n')

  // 1. Teste de conexão com service role
  console.log('1. Conexão (service role)...')
  const supabase = createClient(url, serviceKey)
  const { data: connTest, error: connErr } = await supabase.from('workspaces').select('id').limit(1)
  if (connErr) {
    console.log(`   ❌ Erro: ${connErr.message}`)
    if (connErr.message.includes('does not exist') || connErr.message.includes('relation')) {
      console.log('   ℹ️  Tabela "workspaces" não existe — migrations ainda não executadas')
    }
  } else {
    console.log(`   ✅ Conectado — ${connTest.length} workspace(s) encontrado(s)`)
  }

  // 2. Teste de conexão com anon key
  console.log('\n2. Conexão (anon key)...')
  const anonClient = createClient(url, anonKey)
  const { error: anonErr } = await anonClient.from('workspaces').select('id').limit(1)
  if (anonErr) {
    console.log(`   ❌ Erro: ${anonErr.message}`)
  } else {
    console.log('   ✅ Anon key funcional')
  }

  // 3. Verificar tabelas existentes
  console.log('\n3. Tabelas no schema public...')
  const expectedTables = [
    'workspaces', 'content_pieces', 'content_adaptations',
    'editorial_calendar', 'channel_configs', 'app_config',
    'knowledge_documents', 'document_chunks',
    'user_roles', 'activity_log'
  ]

  for (const table of expectedTables) {
    const { error } = await supabase.from(table).select('*').limit(0)
    if (error) {
      console.log(`   ⬜ ${table} — não existe`)
    } else {
      console.log(`   ✅ ${table} — existe`)
    }
  }

  // 4. Verificar extensão pgvector
  console.log('\n4. Extensão pgvector...')
  const { data: extData, error: extErr } = await supabase
    .from('document_chunks')
    .select('id')
    .limit(0)
  if (extErr && extErr.message.includes('does not exist')) {
    console.log('   ⬜ Tabela document_chunks não existe (pgvector pode não estar habilitado)')
  } else if (extErr) {
    console.log(`   ⚠️  ${extErr.message}`)
  } else {
    console.log('   ✅ document_chunks acessível (pgvector provavelmente habilitado)')
  }

  // 5. Verificar função search_knowledge
  console.log('\n5. Função search_knowledge...')
  const { error: fnErr } = await supabase.rpc('search_knowledge', {
    query_embedding: Array(1536).fill(0),
    p_workspace_id: 'wt',
    match_threshold: 0.70,
    match_count: 1
  })
  if (fnErr) {
    if (fnErr.message.includes('does not exist') || fnErr.message.includes('Could not find')) {
      console.log('   ⬜ Função não existe — migration 002 não executada')
    } else {
      console.log(`   ⚠️  ${fnErr.message}`)
    }
  } else {
    console.log('   ✅ Função search_knowledge disponível')
  }

  // 6. Verificar dados seed (workspace wt)
  console.log('\n6. Seed (workspace "wt")...')
  const { data: wsData, error: wsErr } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('id', 'wt')
    .single()
  if (wsErr) {
    console.log(`   ⬜ Workspace "wt" não encontrado — seed não executado`)
  } else {
    console.log(`   ✅ Workspace: ${wsData.name} (${wsData.id})`)
  }

  // 7. Verificar auth
  console.log('\n7. Supabase Auth...')
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers()
  if (authErr) {
    console.log(`   ❌ Erro ao listar usuários: ${authErr.message}`)
  } else {
    console.log(`   ✅ Auth ativo — ${users.length} usuário(s) registrado(s)`)
    users.forEach(u => {
      console.log(`      - ${u.email} (criado em ${u.created_at})`)
    })
  }

  // 8. Verificar RLS
  console.log('\n8. Row Level Security...')
  const { data: wsAnon } = await anonClient.from('workspaces').select('id')
  if (wsAnon && wsAnon.length === 0) {
    console.log('   ✅ RLS ativo — anon key não retorna dados sem auth (esperado)')
  } else if (wsAnon && wsAnon.length > 0) {
    console.log('   ⚠️  Anon key retornou dados — RLS pode não estar ativo')
  } else {
    console.log('   ℹ️  Não foi possível verificar RLS')
  }

  console.log('\n=== FIM DA VALIDAÇÃO ===\n')
}

validate().catch(err => {
  console.error('Erro fatal na validação:', err.message)
  process.exit(1)
})
