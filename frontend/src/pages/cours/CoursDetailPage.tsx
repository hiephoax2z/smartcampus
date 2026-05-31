import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'

import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import AddNoteModal from './AddNoteModal'


/*
 Composant principal pour afficher les détails d'un cours spécifique.
 On affiche les infos du cours, les séances prévues, les évaluations 
 et la liste des élèves inscrits.
 */

export default function CoursDetailPage() {

  // On récupère l'ID du cours directement depuis l'URL de la page
  const { id } = useParams<{ id: string }>()
  
  // On récupère l'utilisateur connecté pour gérer ses droits d'accès
  const { user } = useAuth()
  
  // État local pour savoir si la fenêtre (modal) d'ajout de note est ouverte ou fermée
  const [modalOpen, setModalOpen] = useState(false)


  /* * RÉCUPÉRATION DES DONNÉES (API)
   * On utilise React Query pour gérer facilement le chargement et la mise en cache.
   */

  // 1. On va chercher les informations générales du cours
  const { data: cours, isLoading } = useQuery({
    queryKey: ['cours', id],

    queryFn: () => api.get(`/cours/${id}`).then((r) => r.data),
  })


  // 2. On récupère la liste de tous les étudiants inscrits à ce cours précis
  const { data: inscrits = [] } = useQuery({
    queryKey: ['inscrits-cours', id],

    queryFn: () => api.get(`/inscriptions?cours_id=${id}`).then((r) => r.data),

    // On ne lance la requête que si on a bien un ID valide
    enabled: !!id,
  })


  // 3. On récupère toutes les évaluations (contrôles, examens) liées au cours
  const { data: evaluations = [] } = useQuery({
    queryKey: ['evaluations-cours', id],

    queryFn: () => api.get(`/evaluations?cours_id=${id}`).then((r) => r.data),

    enabled: !!id,
  })


  // 4. On récupère l'emploi du temps, c'est-à-dire les séances du cours
  const { data: seances = [] } = useQuery({
    queryKey: ['seances-cours', id],

    queryFn: () => api.get(`/seances?cours_id=${id}`).then((r) => r.data),

    enabled: !!id,
  })
