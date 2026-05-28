import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const ACCENT = '#E84525'
const SERIF  = "'Playfair Display', Georgia, serif"

interface Conv {
  other_id: number
  nom: string
  prenom: string
  role: string
  last_msg: string
  last_date: string
  unread: number
  sujet: string
}
interface Message {
  id: number
  expediteur_id: number
  corps: string
  sujet: string
  lu: number
  created_at: string
  exp_nom: string
  exp_prenom: string
  exp_role: string
}
interface Contact {
  id: number; nom: string; prenom: string; role: string
}

const ROLE_LABEL: Record<string,string> = { admin:'Admin', enseignant:'Enseignant', etudiant:'Étudiant' }
const ROLE_COLOR: Record<string,string> = { admin: ACCENT, enseignant:'#3b82f6', etudiant:'#8b5cf6' }

function initials(nom: string, prenom: string) {
  return ((prenom?.[0]??'')+(nom?.[0]??'')).toUpperCase()
}
function fmtTime(d: string) {
  const date = new Date(d), now = new Date()
  const diff = Math.floor((now.getTime()-date.getTime())/1000)
  if (diff < 3600)  return `${Math.max(1,Math.floor(diff/60))} min`
  if (diff < 86400) return `${Math.floor(diff/3600)} h`
  return date.toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})
}
function fmtHour(d: string) {
  return new Date(d).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})
}

export default function MessageriePage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [selectedId, setSelectedId]     = useState<number|null>(null)
  const [newMsg, setNewMsg]             = useState('')
  const [search, setSearch]             = useState('')
  const [showNew, setShowNew]           = useState(false)
  const [newDest, setNewDest]           = useState<Contact|null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: convs = [] } = useQuery<Conv[]>({
    queryKey: ['conversations'],
    queryFn:  () => api.get('/messages/conversations').then(r => r.data),
    refetchInterval: 15_000,
  })
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn:  () => api.get('/messages/contacts').then(r => r.data),
  })
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', selectedId],
    queryFn:  () => api.get(`/messages/${selectedId}`).then(r => r.data),
    enabled:  !!selectedId,
    refetchInterval: 10_000,
  })

  const { mutate: sendMsg, isPending } = useMutation({
    mutationFn: (data: { destinataire_id: number; corps: string; sujet?: string }) =>
      api.post('/messages', data),
    onSuccess: () => {
      setNewMsg('')
      qc.invalidateQueries({ queryKey: ['messages', selectedId ?? newDest?.id] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      if (newDest && !selectedId) { setSelectedId(newDest.id); setShowNew(false); setNewDest(null) }
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  useEffect(() => {
    if (selectedId) qc.invalidateQueries({ queryKey: ['conversations'] })
  }, [selectedId, qc])

  const filteredConvs = convs.filter(c =>
    !search || `${c.prenom} ${c.nom} ${c.sujet}`.toLowerCase().includes(search.toLowerCase())
  )

  const selectedConv = convs.find(c => c.other_id === selectedId)
  const activeDest   = showNew ? newDest : (selectedConv ? { id:selectedConv.other_id, nom:selectedConv.nom, prenom:selectedConv.prenom, role:selectedConv.role } : null)

  function handleSend() {
    const destId = activeDest?.id ?? newDest?.id
    if (!destId || !newMsg.trim()) return
    sendMsg({ destinataire_id: destId, corps: newMsg.trim(), sujet: '' })
  }

  return (
    <div style={{ background:'#111111', minHeight:'100%' }}>
      <div style={{ padding:'2rem 2.5rem' }}>

        <div style={{ marginBottom:'1.75rem', display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
          <div>
            <p style={{ color:'#555', fontSize:11, letterSpacing:'0.18em', marginBottom:8 }}>INBOX</p>
            <h1 style={{ fontFamily:SERIF, fontSize:'clamp(1.8rem,3vw,2.4rem)', color:'#fff', fontWeight:700, lineHeight:1.1 }}>
              Messa<span style={{ color:ACCENT, fontStyle:'italic' }}>gerie.</span>
            </h1>
          </div>
          <button
            onClick={() => { setShowNew(true); setSelectedId(null) }}
            style={{ display:'flex', alignItems:'center', gap:'0.375rem', background:ACCENT, color:'#fff', fontSize:12, fontWeight:600, padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer' }}
          >
            + Nouveau message
          </button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'1.25rem', height:'calc(100vh - 260px)', minHeight:500 }}>

          {/* ── Sidebar conversations ───────────────────────────────── */}
          <div style={{ background:'#161616', border:'1px solid #1f1f1f', borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            {/* Search */}
            <div style={{ padding:'0.75rem', borderBottom:'1px solid #1e1e1e' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'#111', border:'1px solid #222', borderRadius:8, padding:'6px 10px', color:'#555' }}>
                <svg width="12" height="12" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="5.5" cy="5.5" r="4"/><path d="M9 9l2.5 2.5"/></svg>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…"
                  style={{ background:'transparent', border:'none', outline:'none', color:'#ccc', fontSize:12, width:'100%' }}/>
              </div>
            </div>

            {/* Liste */}
            <div style={{ flex:1, overflowY:'auto' }}>
              {filteredConvs.length === 0 && (
                <p style={{ padding:'2rem', color:'#444', fontSize:13, textAlign:'center' }}>Aucune conversation</p>
              )}
              {filteredConvs.map(c => {
                const active = selectedId === c.other_id
                const rc = ROLE_COLOR[c.role] ?? '#555'
                return (
                  <button
                    key={c.other_id}
                    onClick={() => { setSelectedId(c.other_id); setShowNew(false) }}
                    style={{
                      width:'100%', textAlign:'left', padding:'0.875rem 1rem',
                      background: active ? '#1e1e1e' : 'transparent',
                      borderLeft: `3px solid ${active ? ACCENT : 'transparent'}`,
                      borderBottom:'1px solid #191919', border:'none',
                      cursor:'pointer', display:'flex', gap:'0.75rem', alignItems:'flex-start',
                      transition:'background 0.1s',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ width:36, height:36, borderRadius:'50%', flexShrink:0, background:rc+'22', border:`1px solid ${rc}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:rc }}>
                      {initials(c.nom, c.prenom)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                        <span style={{ color: c.unread > 0 ? '#fff' : '#888', fontSize:13, fontWeight: c.unread > 0 ? 600 : 400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }}>
                          {c.prenom} {c.nom}
                        </span>
                        <span style={{ color:'#333', fontSize:10, flexShrink:0, marginLeft:4 }}>{fmtTime(c.last_date)}</span>
                      </div>
                      <p style={{ color:'#555', fontSize:11, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.sujet || '—'}</p>
                      <p style={{ color: c.unread > 0 ? '#888' : '#3a3a3a', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.last_msg}</p>
                    </div>
                    {c.unread > 0 && (
                      <span style={{ width:18, height:18, borderRadius:'50%', background:ACCENT, color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                        {c.unread}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Panneau conversation ─────────────────────────────────── */}
          <div style={{ background:'#161616', border:'1px solid #1f1f1f', borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column' }}>

            {/* Nouveau message : sélectionner destinataire */}
            {showNew && !activeDest && (
              <div style={{ flex:1, padding:'2rem' }}>
                <p style={{ color:'#fff', fontSize:14, fontWeight:600, marginBottom:'1rem' }}>Nouveau message</p>
                <p style={{ color:'#555', fontSize:12, marginBottom:'0.75rem' }}>Destinataire</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', maxHeight:400, overflowY:'auto' }}>
                  {contacts.map(c => {
                    const rc = ROLE_COLOR[c.role] ?? '#555'
                    return (
                      <button key={c.id} onClick={()=>setNewDest(c)}
                        style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', background:'#111', border:'1px solid #222', borderRadius:8, cursor:'pointer', textAlign:'left', transition:'border-color 0.15s' }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=rc}
                        onMouseLeave={e=>e.currentTarget.style.borderColor='#222'}
                      >
                        <div style={{ width:32, height:32, borderRadius:'50%', background:rc+'22', color:rc, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {initials(c.nom,c.prenom)}
                        </div>
                        <div>
                          <p style={{ color:'#ccc', fontSize:13, fontWeight:500 }}>{c.prenom} {c.nom}</p>
                          <p style={{ color:rc, fontSize:11 }}>{ROLE_LABEL[c.role]??c.role}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Conversation */}
            {(selectedId || activeDest) && (
              <>
                {/* Header */}
                <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #1e1e1e', display:'flex', alignItems:'center', gap:'0.875rem' }}>
                  {activeDest && (
                    <>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:(ROLE_COLOR[activeDest.role]??'#555')+'22', border:`1px solid ${(ROLE_COLOR[activeDest.role]??'#555')}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:ROLE_COLOR[activeDest.role]??'#555' }}>
                        {initials(activeDest.nom, activeDest.prenom)}
                      </div>
                      <div>
                        <p style={{ color:'#fff', fontSize:13, fontWeight:600 }}>{activeDest.prenom} {activeDest.nom}</p>
                        <p style={{ color:ROLE_COLOR[activeDest.role]??'#555', fontSize:11 }}>{ROLE_LABEL[activeDest.role]??activeDest.role}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Messages */}
                <div style={{ flex:1, overflowY:'auto', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  {messages.map(m => {
                    const isMine = m.expediteur_id === user?.id
                    return (
                      <div key={m.id} style={{ display:'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                        {!isMine && (
                          <div style={{ width:28, height:28, borderRadius:'50%', background:(ROLE_COLOR[m.exp_role]??'#555')+'22', color:ROLE_COLOR[m.exp_role]??'#555', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginRight:8, alignSelf:'flex-end' }}>
                            {initials(m.exp_nom,m.exp_prenom)}
                          </div>
                        )}
                        <div style={{ maxWidth:'65%' }}>
                          {!isMine && m.sujet && (
                            <p style={{ color:'#555', fontSize:10, marginBottom:3, marginLeft:4 }}>{m.sujet}</p>
                          )}
                          <div style={{
                            background: isMine ? ACCENT : '#1e1e1e',
                            color: '#fff',
                            borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            padding:'10px 14px', fontSize:13, lineHeight:1.6,
                            whiteSpace:'pre-wrap',
                          }}>
                            {m.corps}
                          </div>
                          <p style={{ color:'#333', fontSize:10, marginTop:3, textAlign: isMine?'right':'left' }}>
                            {fmtHour(m.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {messages.length === 0 && !showNew && (
                    <p style={{ color:'#444', textAlign:'center', fontSize:13, marginTop:'2rem' }}>Commencez la conversation</p>
                  )}
                  <div ref={bottomRef}/>
                </div>

                {/* Input */}
                <div style={{ padding:'0.875rem 1rem', borderTop:'1px solid #1e1e1e', display:'flex', gap:'0.625rem', alignItems:'flex-end' }}>
                  <textarea
                    value={newMsg}
                    onChange={e=>setNewMsg(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()} }}
                    placeholder="Écrivez un message… (Entrée pour envoyer)"
                    rows={2}
                    style={{
                      flex:1, background:'#111', border:'1px solid #222', borderRadius:10,
                      padding:'10px 14px', color:'#ccc', fontSize:13, resize:'none',
                      outline:'none', lineHeight:1.5,
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isPending || !newMsg.trim()}
                    style={{
                      background: ACCENT, color:'#fff', border:'none', borderRadius:10,
                      padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer',
                      opacity: (!newMsg.trim()||isPending) ? 0.5 : 1, transition:'opacity 0.15s',
                    }}
                  >
                    Envoyer
                  </button>
                </div>
              </>
            )}

            {/* Empty state */}
            {!selectedId && !showNew && (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.75rem' }}>
                <div style={{ fontSize:36, opacity:0.3 }}>💬</div>
                <p style={{ color:'#444', fontSize:14 }}>Sélectionnez une conversation</p>
                <p style={{ color:'#333', fontSize:12 }}>ou commencez-en une nouvelle</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
