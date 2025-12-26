
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  DollarSign, 
  Newspaper, 
  Folder, 
  CheckCircle,
  Megaphone,
  LogOut,
  Save,
  PlusCircle,
  Trash2,
  Edit,
  Download,
  Lock,
  Unlock,
  MessageSquare,
  ThumbsUp,
  Heart,
  PartyPopper,
  Share2,
  Send,
  Eye,
  EyeOff,
  Bell,
  User as UserIcon,
  X
} from 'lucide-react';
import { 
  Role, User, Student, Presence, Offering, FeedItem, FileEntry, Registration, Area, Comment
} from './types';
import { INITIAL_STUDENTS } from './constants';

const App: React.FC = () => {
  const STORAGE_KEY = 'mci_kids_state_v1';

  // --- Core State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentArea, setCurrentArea] = useState<Area | 'home'>('home');
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  
  const [profileFilter, setProfileFilter] = useState<string | null>(null);

  // Settings & Closing
  const [accumulatedBalance, setAccumulatedBalance] = useState(0);
  const [lastMonthClosure, setLastMonthClosure] = useState<string | null>(null);
  const [presenceClosedAt, setPresenceClosedAt] = useState<string | null>(null);
  const [allowEditsAfterClosure, setAllowEditsAfterClosure] = useState(false);

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.presences) setPresences(parsed.presences);
        if (parsed.offerings) setOfferings(parsed.offerings);
        if (parsed.feed) setFeed(parsed.feed);
        if (parsed.files) setFiles(parsed.files);
        if (parsed.registrations) setRegistrations(parsed.registrations);
        if (parsed.accumulatedBalance) setAccumulatedBalance(parsed.accumulatedBalance);
        if (parsed.lastMonthClosure) setLastMonthClosure(parsed.lastMonthClosure);
        if (parsed.presenceClosedAt) setPresenceClosedAt(parsed.presenceClosedAt);
        if (parsed.allowEditsAfterClosure !== undefined) setAllowEditsAfterClosure(parsed.allowEditsAfterClosure);
        if (parsed.students) setStudents(parsed.students);
      } catch (e) {
        console.error("Error parsing state", e);
      }
    }
  }, []);

  // Save Data
  useEffect(() => {
    const state = {
      presences, offerings, feed, files, registrations, 
      accumulatedBalance, lastMonthClosure, presenceClosedAt, 
      allowEditsAfterClosure, students
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [presences, offerings, feed, files, registrations, accumulatedBalance, lastMonthClosure, presenceClosedAt, allowEditsAfterClosure, students]);

  // --- Handlers ---
  const handleLogin = (role: Role, email?: string, name?: string) => {
    if (role === 'lider') {
      setCurrentUser({ uid: 'lider-1', nome: 'Líder', papel: 'lider' });
      alert('Líder logado com sucesso!');
    } else if (role === 'auxiliar') {
      if (!name) return alert('Informe seu nome.');
      setCurrentUser({ uid: `aux-${Date.now()}`, nome: name, papel: 'auxiliar' });
      alert(`Auxiliar ${name} entrou.`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentArea('home');
    setProfileFilter(null);
  };

  const handleReaction = (postId: string, type: 'gostei' | 'coracao' | 'festa') => {
    if (!currentUser) return alert("Entre no portal para reagir!");

    setFeed(prev => prev.map(post => {
      if (post.id === postId) {
        const userMap = post.usuariosQueReagiram || {};
        const previousReaction = userMap[currentUser.uid];

        const newReactions = { ...post.reacoes };
        const newUsersMap = { ...userMap };

        // Toggle: Se clicar na mesma, remove
        if (previousReaction === type) {
          newReactions[type] = Math.max(0, newReactions[type] - 1);
          newUsersMap[currentUser.uid] = null;
        } else {
          // Se já tinha outra reação, tira a antiga antes de por a nova
          if (previousReaction) {
            newReactions[previousReaction] = Math.max(0, newReactions[previousReaction] - 1);
          }
          newReactions[type] = (newReactions[type] || 0) + 1;
          newUsersMap[currentUser.uid] = type;
        }

        return { ...post, reacoes: newReactions, usuariosQueReagiram: newUsersMap };
      }
      return post;
    }));
  };

  const handleAddComment = (postId: string, text: string) => {
    if (!text.trim()) return;
    const newComment: Comment = {
      nome: currentUser?.nome || 'Visitante',
      texto: text,
      aprovado: true
    };
    setFeed(prev => prev.map(post => {
      if (post.id === postId) {
        return { ...post, comentarios: [...(post.comentarios || []), newComment] };
      }
      return post;
    }));
  };

  const handleDeletePost = (postId: string) => {
    const post = feed.find(p => p.id === postId);
    if (!post) return;
    if (currentUser?.papel !== 'lider' && post.criadoPorNome !== currentUser?.nome) return;
    if (confirm('Excluir postagem?')) {
      setFeed(prev => prev.filter(p => p.id !== postId));
    }
  };

  const handleShare = async (post: FeedItem) => {
    const shareText = `MCI Kids - ${post.tipo.toUpperCase()}\n\n${post.texto}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'MCI Kids', text: shareText }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Link copiado!');
    }
  };

  const handleVisitProfile = (nome: string) => {
    setProfileFilter(nome);
    setCurrentArea('feed');
  };

  // --- Filters ---
  const financeTotals = useMemo(() => {
    const entries = offerings.filter(o => o.categoria === 'oferta' && o.tipo === 'entrada').reduce((s, o) => s + o.valor, 0);
    const exits = offerings.filter(o => o.categoria === 'oferta' && o.tipo === 'saida').reduce((s, o) => s + o.valor, 0);
    return { entries, exits, balance: entries - exits };
  }, [offerings]);

  const visibleFeed = useMemo(() => {
    const name = currentUser?.nome?.toLowerCase() || '';
    let filtered = [...feed].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

    if (profileFilter) {
      filtered = filtered.filter(item => item.criadoPorNome === profileFilter);
    }

    if (currentUser?.papel === 'lider') return filtered;

    return filtered.filter(item => 
      item.publico || 
      item.mencionados.some(m => m.toLowerCase() === name) ||
      item.criadoPorNome === currentUser?.nome
    );
  }, [feed, currentUser, profileFilter]);

  const publicFeed = useMemo(() => {
    return feed.filter(f => f.publico).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }, [feed]);

  // --- Components ---

  const Header = () => (
    <header className="bg-[#4B1E6D]/95 text-white p-6 text-center shadow-lg sticky top-0 z-50">
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-2 shadow-inner overflow-hidden border-2 border-white">
          <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid || 'guest'}`} alt="MCI Kids" className="rounded-full" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">MCI Kids - Ministério Infantil</h1>
      </div>
    </header>
  );

  const FeedCard: React.FC<{ item: FeedItem }> = ({ item }) => {
    const [commentInput, setCommentInput] = useState('');
    const [showHeart, setShowHeart] = useState(false);
    const lastTap = useRef<number>(0);

    const handleDoubleTap = () => {
      const now = Date.now();
      const DOUBLE_PRESS_DELAY = 300;
      if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
        // Double tap detectado
        handleReaction(item.id, 'coracao');
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 1000);
      }
      lastTap.current = now;
    };

    const userReaction = currentUser ? item.usuariosQueReagiram?.[currentUser.uid] : null;

    return (
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 group relative">
        {/* Animação do Coração (Double Tap) */}
        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <Heart size={100} className="text-white fill-pink-500 animate-ping opacity-75" />
          </div>
        )}

        <div className="p-6 pb-2" onTouchEnd={handleDoubleTap} onClick={handleDoubleTap}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); handleVisitProfile(item.criadoPorNome); }}
                className="w-12 h-12 bg-gradient-to-br from-[#4B1E6D] to-pink-500 text-white rounded-full flex items-center justify-center font-black text-xl shadow-md hover:scale-110 transition-transform"
              >
                {item.criadoPorNome[0]}
              </button>
              <div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleVisitProfile(item.criadoPorNome); }}
                  className="font-bold text-lg text-gray-800 leading-none hover:text-[#4B1E6D] flex items-center gap-1"
                >
                  {item.criadoPorNome}
                  <UserIcon size={14} className="opacity-40" />
                </button>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                  {new Date(item.criadoEm).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
                item.tipo === 'evento' ? 'bg-pink-100 text-pink-600 border-pink-200' : 
                item.tipo === 'escala' ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 
                'bg-cyan-100 text-cyan-600 border-cyan-200'
              }`}>
                {item.tipo.toUpperCase()}
              </span>
              {(currentUser?.papel === 'lider' || item.criadoPorNome === currentUser?.nome) && (
                <button onClick={(e) => { e.stopPropagation(); handleDeletePost(item.id); }} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
              )}
            </div>
          </div>
          <div className="mt-4 cursor-pointer select-none">
            <p className="text-gray-700 text-lg leading-relaxed">{item.texto}</p>
            {item.mencionados.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {item.mencionados.map(m => <span key={m} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-black uppercase">@{m}</span>)}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 flex items-center justify-between bg-gray-50/50 border-y gap-4">
          <div className="flex gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); handleReaction(item.id, 'gostei'); }} 
              className={`flex items-center gap-1 transition-all active:scale-125 ${userReaction === 'gostei' ? 'text-cyan-600 font-bold' : 'text-gray-400 hover:text-cyan-600'}`}
            >
              <ThumbsUp size={22} className={userReaction === 'gostei' ? 'fill-cyan-600' : ''} />
              <span className="text-sm font-black">{item.reacoes.gostei}</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleReaction(item.id, 'coracao'); }} 
              className={`flex items-center gap-1 transition-all active:scale-125 ${userReaction === 'coracao' ? 'text-pink-600 font-bold' : 'text-gray-400 hover:text-pink-600'}`}
            >
              <Heart size={22} className={userReaction === 'coracao' ? 'fill-pink-600' : ''} />
              <span className="text-sm font-black">{item.reacoes.coracao}</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleReaction(item.id, 'festa'); }} 
              className={`flex items-center gap-1 transition-all active:scale-125 ${userReaction === 'festa' ? 'text-yellow-500 font-bold' : 'text-gray-400 hover:text-yellow-600'}`}
            >
              <PartyPopper size={22} />
              <span className="text-sm font-black">{item.reacoes.festa}</span>
            </button>
          </div>
          <button onClick={(e) => { e.stopPropagation(); handleShare(item); }} className="text-gray-400 hover:text-[#4B1E6D] p-1"><Share2 size={20} /></button>
        </div>

        <div className="p-4 space-y-3 bg-white">
          {item.comentarios?.map((c, idx) => (
            <div key={idx} className="flex gap-3 group/comment">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 border border-indigo-200">
                {c.nome[0]}
              </div>
              <div className="bg-gray-100/70 p-3 rounded-2xl flex-1 text-sm shadow-sm">
                <span className="font-black text-indigo-900 mr-2">{c.nome}</span>
                <span className="text-gray-600">{c.texto}</span>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <input 
              value={commentInput} 
              onChange={e => setCommentInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (handleAddComment(item.id, commentInput), setCommentInput(''))}
              placeholder="Adicione um comentário..." 
              className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 text-sm outline-none focus:ring-2 ring-pink-100 transition-all"
            />
            <button 
              onClick={() => { handleAddComment(item.id, commentInput); setCommentInput(''); }} 
              className="w-10 h-10 bg-gradient-to-br from-pink-500 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Mural = () => (
    <section className="bg-[#FCE4EC] p-8 rounded-[3rem] shadow-xl mt-12 border-b-8 border-pink-200 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10"><Megaphone size={120} /></div>
      <h2 className="text-3xl font-black mb-8 flex items-center gap-3 text-[#4B1E6D]">
        <Megaphone className="text-pink-600 animate-bounce" /> Mural de Notícias
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publicFeed.length === 0 ? (
          <p className="text-gray-500 italic col-span-full text-center py-10 font-bold">O mural está vazio por enquanto.</p>
        ) : (
          publicFeed.slice(0, 3).map(item => <FeedCard key={item.id} item={item} />)
        )}
      </div>
    </section>
  );

  const MenuGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
      <button onClick={() => setCurrentArea('pais')} className="group p-8 bg-orange-400 text-white rounded-[2.5rem] shadow-xl flex flex-col items-center gap-3 transition-all hover:-translate-y-2 hover:bg-orange-500">
        <Users size={40} className="group-hover:scale-125 transition-transform" /> <span className="font-black text-lg">PAIS</span>
      </button>
      <button onClick={() => setCurrentArea('lider')} className="group p-8 bg-purple-500 text-white rounded-[2.5rem] shadow-xl flex flex-col items-center gap-3 transition-all hover:-translate-y-2 hover:bg-purple-600">
        <ShieldCheck size={40} className="group-hover:scale-125 transition-transform" /> <span className="font-black text-lg">LÍDER</span>
      </button>
      <button onClick={() => setCurrentArea('auxiliar')} className="group p-8 bg-blue-500 text-white rounded-[2.5rem] shadow-xl flex flex-col items-center gap-3 transition-all hover:-translate-y-2 hover:bg-blue-600">
        <UserPlus size={40} className="group-hover:scale-125 transition-transform" /> <span className="font-black text-lg">AUXILIAR</span>
      </button>
      <button onClick={() => setCurrentArea('oferta')} className="group p-8 bg-green-500 text-white rounded-[2.5rem] shadow-xl flex flex-col items-center gap-3 transition-all hover:-translate-y-2 hover:bg-green-600">
        <DollarSign size={40} className="group-hover:scale-125 transition-transform" /> <span className="font-black text-lg">OFERTA</span>
      </button>
      <button onClick={() => { setProfileFilter(null); setCurrentArea('feed'); }} className="group p-8 bg-cyan-400 text-white rounded-[2.5rem] shadow-xl flex flex-col items-center gap-3 transition-all hover:-translate-y-2 hover:bg-cyan-500">
        <Newspaper size={40} className="group-hover:scale-125 transition-transform" /> <span className="font-black text-lg">FEED</span>
      </button>
      <button onClick={() => setCurrentArea('arquivos')} className="group p-8 bg-yellow-500 text-white rounded-[2.5rem] shadow-xl flex flex-col items-center gap-3 transition-all hover:-translate-y-2 hover:bg-yellow-600">
        <Folder size={40} className="group-hover:scale-125 transition-transform" /> <span className="font-black text-lg">ARQUIVOS</span>
      </button>
      <button onClick={() => setCurrentArea('presenca')} className="group p-8 bg-indigo-500 text-white rounded-[2.5rem] shadow-xl flex flex-col items-center gap-3 transition-all hover:-translate-y-2 hover:bg-indigo-600">
        <CheckCircle size={40} className="group-hover:scale-125 transition-transform" /> <span className="font-black text-lg">PRESENÇA</span>
      </button>
    </div>
  );

  const AreaContainer = ({ title, children, icon: Icon }: any) => (
    <div className="bg-white/95 p-6 md:p-10 rounded-[3rem] shadow-2xl mt-12 max-w-6xl mx-auto border-8 border-[#4B1E6D]/5 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b-4 border-gray-50 pb-6 gap-6">
        <h2 className="text-4xl font-black flex items-center gap-4 text-[#4B1E6D]">
          {Icon && <Icon size={48} className="text-pink-500" />} {title}
        </h2>
        <button onClick={() => { setCurrentArea('home'); setProfileFilter(null); }} className="bg-gray-100 px-8 py-3 rounded-2xl text-gray-700 font-black border-2 border-transparent hover:border-indigo-200 hover:bg-white transition-all">VOLTAR</button>
      </div>
      {children}
    </div>
  );

  const PaisArea = () => {
    const [form, setForm] = useState({ nome: '', nasc: '', resp: '', tel: '', endereco: '', telEmerg: '', contatoEmerg: '', obs: '' });
    return (
      <AreaContainer title="Espaço Família" icon={Users}>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h3 className="text-2xl font-black flex items-center gap-3 text-pink-600"><Bell size={32} /> Avisos e Feed</h3>
            <div className="space-y-6">
              {publicFeed.length === 0 ? <p className="text-gray-400 italic font-bold">Sem avisos recentes.</p> : publicFeed.map(item => <FeedCard key={item.id} item={item} />)}
            </div>
          </div>
          <div className="space-y-8">
            <h3 className="text-2xl font-black flex items-center gap-3 text-indigo-600"><UserPlus size={32} /> Cadastrar Criança</h3>
            <div className="space-y-4 bg-gray-50 p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-inner">
              <div className="space-y-2"><label className="text-xs font-black text-indigo-900 ml-2">NOME DA CRIANÇA</label><input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full p-4 border rounded-2xl outline-none focus:ring-4 ring-indigo-200" placeholder="Digite aqui..." /></div>
              <div className="space-y-2"><label className="text-xs font-black text-indigo-900 ml-2">DATA DE NASCIMENTO</label><input type="date" value={form.nasc} onChange={e => setForm({...form, nasc: e.target.value})} className="w-full p-4 border rounded-2xl outline-none focus:ring-4 ring-indigo-200" /></div>
              <div className="space-y-2"><label className="text-xs font-black text-indigo-900 ml-2">RESPONSÁVEL</label><input value={form.resp} onChange={e => setForm({...form, resp: e.target.value})} className="w-full p-4 border rounded-2xl outline-none focus:ring-4 ring-indigo-200" placeholder="Nome do pai/mãe" /></div>
              <div className="space-y-2"><label className="text-xs font-black text-indigo-900 ml-2">WHATSAPP</label><input value={form.tel} onChange={e => setForm({...form, tel: e.target.value})} className="w-full p-4 border rounded-2xl outline-none focus:ring-4 ring-indigo-200" placeholder="(00) 00000-0000" /></div>
              <button onClick={() => {
                if(!form.nome || !form.tel) return alert('Campos obrigatórios faltando!');
                setRegistrations([{ ...form, id: `reg-${Date.now()}`, criadoEm: new Date().toISOString() }, ...registrations]);
                setForm({ nome: '', nasc: '', resp: '', tel: '', endereco: '', telEmerg: '', contatoEmerg: '', obs: '' });
                alert('Ficha cadastrada com sucesso!');
              }} className="w-full p-5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] transition-all mt-4">SALVAR CADASTRO</button>
            </div>
          </div>
        </div>
      </AreaContainer>
    );
  };

  const LiderArea = () => {
    const [loginForm, setLoginForm] = useState({ email: '', senha: '' });
    if (currentUser?.papel !== 'lider') {
      return (
        <AreaContainer title="Acesso Reservado" icon={ShieldCheck}>
          <div className="max-w-md mx-auto space-y-6 text-center">
            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Área exclusiva para coordenação</p>
            <input value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full p-5 border-2 rounded-2xl outline-none focus:ring-4 ring-purple-100 text-center text-xl font-bold" placeholder="E-mail" />
            <input type="password" value={loginForm.senha} onChange={e => setLoginForm({...loginForm, senha: e.target.value})} className="w-full p-5 border-2 rounded-2xl outline-none focus:ring-4 ring-purple-100 text-center text-xl font-bold" placeholder="Senha" />
            <button onClick={() => handleLogin('lider', loginForm.email)} className="w-full p-5 bg-purple-600 text-white rounded-2xl font-black text-2xl shadow-xl hover:bg-purple-700 transition-all">ENTRAR NO PAINEL</button>
          </div>
        </AreaContainer>
      );
    }
    return (
      <AreaContainer title="Painel Coordenador" icon={ShieldCheck}>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="p-8 bg-green-50 rounded-[2.5rem] border-4 border-white shadow-lg flex flex-col justify-center">
            <h4 className="font-black text-green-800 mb-4 uppercase text-xs tracking-widest">Saldo do Ministério</h4>
            <p className="text-4xl font-black text-green-600">R$ {financeTotals.balance.toFixed(2)}</p>
          </div>
          <div className="p-8 bg-indigo-50 rounded-[2.5rem] border-4 border-white shadow-lg flex flex-col justify-center">
            <h4 className="font-black text-indigo-800 mb-4 uppercase text-xs tracking-widest">Alunos Ativos</h4>
            <p className="text-4xl font-black text-indigo-600">{students.length} Crianças</p>
          </div>
          <div className="p-8 bg-pink-50 rounded-[2.5rem] border-4 border-white shadow-lg flex flex-col items-center justify-center">
             <button onClick={handleLogout} className="flex items-center gap-2 bg-white px-8 py-3 rounded-2xl text-red-600 font-black shadow-md hover:bg-red-50 transition-colors uppercase text-sm"><LogOut size={20} /> Encerrar Sessão</button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-gray-50 p-10 rounded-[3rem] border-4 border-white shadow-inner">
            <h4 className="font-black text-2xl mb-8 text-gray-700 uppercase tracking-tighter">Atalhos de Gestão</h4>
            <div className="grid gap-4">
              <button onClick={() => setCurrentArea('presenca')} className="bg-white p-5 rounded-2xl border-2 border-indigo-50 font-black text-indigo-700 hover:shadow-lg transition-all text-left flex items-center justify-between group"><span>CHAMADA DO DIA</span> <CheckCircle className="group-hover:scale-125 transition-transform" /></button>
              <button onClick={() => setCurrentArea('oferta')} className="bg-white p-5 rounded-2xl border-2 border-green-50 font-black text-green-700 hover:shadow-lg transition-all text-left flex items-center justify-between group"><span>RELATÓRIO FINANCEIRO</span> <DollarSign className="group-hover:scale-125 transition-transform" /></button>
              <button onClick={() => { setProfileFilter(null); setCurrentArea('feed'); }} className="bg-white p-5 rounded-2xl border-2 border-cyan-50 font-black text-cyan-700 hover:shadow-lg transition-all text-left flex items-center justify-between group"><span>GERENCIAR FEED</span> <Newspaper className="group-hover:scale-125 transition-transform" /></button>
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="font-black text-2xl flex items-center gap-3 text-[#4B1E6D] uppercase tracking-tighter">Feed da Liderança</h4>
            <div className="grid gap-6">
              {visibleFeed.slice(0, 2).map(item => <FeedCard key={item.id} item={item} />)}
            </div>
          </div>
        </div>
      </AreaContainer>
    );
  };

  const AuxiliarArea = () => {
    const [name, setName] = useState('');
    if (!currentUser) {
      return (
        <AreaContainer title="Portal Auxiliar" icon={UserPlus}>
          <div className="max-w-md mx-auto space-y-6 text-center">
            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Identifique-se para começar</p>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full p-5 border-2 rounded-2xl outline-none focus:ring-4 ring-blue-100 text-center text-xl font-bold" placeholder="Nome do Professor" />
            <button onClick={() => handleLogin('auxiliar', undefined, name)} className="w-full p-5 bg-blue-600 text-white rounded-2xl font-black text-2xl shadow-xl hover:bg-blue-700 transition-all">INICIAR TRABALHO</button>
          </div>
        </AreaContainer>
      );
    }
    return (
      <AreaContainer title={`Bom trabalho, ${currentUser.nome}`} icon={UserPlus}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <button onClick={() => setCurrentArea('presenca')} className="group p-8 bg-indigo-500 text-white rounded-[2.5rem] shadow-xl flex flex-col items-center gap-3 font-black hover:scale-105 transition-all"><CheckCircle size={40} /> CHAMADA</button>
          <button onClick={() => setCurrentArea('oferta')} className="group p-8 bg-green-500 text-white rounded-[2.5rem] shadow-xl flex flex-col items-center gap-3 font-black hover:scale-105 transition-all"><DollarSign size={40} /> OFERTAS</button>
          <button onClick={() => { setProfileFilter(null); setCurrentArea('feed'); }} className="group p-8 bg-cyan-500 text-white rounded-[2.5rem] shadow-xl flex flex-col items-center gap-3 font-black hover:scale-105 transition-all"><Newspaper size={40} /> FEED</button>
          <button onClick={handleLogout} className="group p-8 bg-red-500 text-white rounded-[2.5rem] shadow-xl flex flex-col items-center gap-3 font-black hover:scale-105 transition-all"><LogOut size={40} /> SAIR</button>
        </div>
      </AreaContainer>
    );
  };

  const PresencaArea = () => {
    const [dia, setDia] = useState(new Date().toISOString().slice(0, 10));
    const [novoAluno, setNovoAluno] = useState({ nome: '', tipo: 'aluno' as const });
    return (
      <AreaContainer title="Controle de Chamada" icon={CheckCircle}>
        <div className="flex flex-wrap gap-6 items-end mb-10 bg-indigo-50/50 p-8 rounded-[2.5rem] border-4 border-white shadow-inner">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-indigo-900 ml-2 uppercase tracking-widest">Data do Culto</label>
            <input type="date" value={dia} onChange={e => setDia(e.target.value)} className="p-4 border-2 border-indigo-100 rounded-2xl outline-none focus:ring-4 ring-indigo-100 font-bold" />
          </div>
          <div className="flex flex-col gap-2 flex-grow">
            <label className="text-xs font-black text-indigo-900 ml-2 uppercase tracking-widest">Adicionar Nome Manualmente</label>
            <div className="flex gap-3">
              <input value={novoAluno.nome} onChange={e => setNovoAluno({...novoAluno, nome: e.target.value})} className="p-4 border-2 border-indigo-100 rounded-2xl flex-grow outline-none focus:ring-4 ring-indigo-100 font-bold" placeholder="Nome da criança ou convidado" />
              <button onClick={() => {
                if(!novoAluno.nome) return;
                setStudents([...students, { id: `al-${Date.now()}`, ...novoAluno }].sort((a,b)=>a.nome.localeCompare(b.nome)));
                setNovoAluno({ nome: '', tipo: 'aluno' });
              }} className="bg-indigo-600 text-white p-4 px-8 rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2 font-black shadow-lg"><PlusCircle size={24} /> ADD</button>
            </div>
          </div>
          {currentUser?.papel === 'lider' && (
             <button onClick={() => setPresenceClosedAt(presenceClosedAt ? null : new Date().toISOString())} className={`px-10 py-5 rounded-2xl text-white font-black transition-all shadow-xl ${presenceClosedAt ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-600 hover:bg-red-700'}`}>
               {presenceClosedAt ? 'REABRIR CHAMADA' : 'ENCERRAR CHAMADA'}
             </button>
          )}
        </div>
        <div className="overflow-x-auto bg-white rounded-[2rem] border-4 border-gray-50 shadow-sm">
          <table className="w-full text-left">
            <thead><tr className="bg-gray-50/50 border-b-2 border-gray-100"><th className="p-6 font-black uppercase text-xs text-gray-400">Nome da Criança</th><th className="p-6 font-black uppercase text-xs text-gray-400 text-center">Status</th><th className="p-6 font-black uppercase text-xs text-gray-400 text-right">Marcar Presença</th></tr></thead>
            <tbody className="divide-y-2 divide-gray-50">
              {students.map(s => {
                const reg = presences.find(p => p.alunoId === s.id && p.dataISO === dia);
                return (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-6 font-black text-indigo-900 text-lg">{s.nome}</td>
                    <td className="p-6 text-center">
                      {reg ? (
                        <span className={`px-5 py-2 rounded-full text-xs font-black tracking-widest ${reg.presente ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {reg.presente ? 'PRESENTE' : 'FALTA'}
                        </span>
                      ) : (
                        <span className="text-gray-300 font-bold uppercase text-xs tracking-widest">Aguardando</span>
                      )}
                    </td>
                    <td className="p-6 flex gap-3 justify-end">
                      <button onClick={() => {
                        if(presenceClosedAt && currentUser?.papel !== 'lider') return alert('Chamada encerrada!');
                        const idx = presences.findIndex(p => p.alunoId === s.id && p.dataISO === dia);
                        if(idx >= 0) {
                          const updated = [...presences];
                          updated[idx].presente = true;
                          setPresences(updated);
                        } else {
                          setPresences([...presences, { id: `pr-${Date.now()}`, alunoId: s.id, dataISO: dia, presente: true, registradoPorNome: currentUser?.nome || 'Anônimo', papel: currentUser?.papel || 'visitante', criadoEm: new Date().toISOString() }]);
                        }
                      }} className="w-12 h-12 bg-green-500 text-white rounded-2xl font-black text-xl hover:bg-green-600 transition-all shadow-md active:scale-90">P</button>
                      <button onClick={() => {
                        if(presenceClosedAt && currentUser?.papel !== 'lider') return alert('Chamada encerrada!');
                        const idx = presences.findIndex(p => p.alunoId === s.id && p.dataISO === dia);
                        if(idx >= 0) {
                          const updated = [...presences];
                          updated[idx].presente = false;
                          setPresences(updated);
                        } else {
                          setPresences([...presences, { id: `pr-${Date.now()}`, alunoId: s.id, dataISO: dia, presente: false, registradoPorNome: currentUser?.nome || 'Anônimo', papel: currentUser?.papel || 'visitante', criadoEm: new Date().toISOString() }]);
                        }
                      }} className="w-12 h-12 bg-red-500 text-white rounded-2xl font-black text-xl hover:bg-red-600 transition-all shadow-md active:scale-90">F</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AreaContainer>
    );
  };

  const OfertaArea = () => {
    const [form, setForm] = useState({ cat: 'oferta' as const, tipo: 'entrada' as const, valor: '', obs: '' });
    return (
      <AreaContainer title="Tesouraria Kids" icon={DollarSign}>
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          <div className="bg-green-50/50 p-10 rounded-[3rem] border-4 border-white space-y-6 shadow-inner">
            <h3 className="font-black text-green-700 flex items-center gap-3 text-2xl uppercase tracking-tighter"><PlusCircle size={32} /> Nova Movimentação</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-green-800 ml-2 uppercase tracking-widest">CATEGORIA</label>
                <select value={form.cat} onChange={e => setForm({...form, cat: e.target.value as any})} className="w-full p-4 border-2 border-green-100 rounded-2xl font-bold bg-white outline-none focus:ring-4 ring-green-100">
                  <option value="oferta">OFERTA</option><option value="gasto">GASTO</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-green-800 ml-2 uppercase tracking-widest">TIPO</label>
                <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value as any})} className="w-full p-4 border-2 border-green-100 rounded-2xl font-bold bg-white outline-none focus:ring-4 ring-green-100">
                  <option value="entrada">ENTRADA</option><option value="saida">SAÍDA</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-green-800 ml-2 uppercase tracking-widest">VALOR EM REAIS</label>
              <input type="number" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} className="w-full p-5 border-2 border-green-100 rounded-2xl font-black text-2xl outline-none focus:ring-4 ring-green-100" placeholder="0,00" />
            </div>
            <button onClick={() => {
              const v = parseFloat(form.valor);
              if(isNaN(v) || v <= 0) return alert('Valor inválido!');
              setOfferings([{ id: `of-${Date.now()}`, ...form, valor: v, criadoEm: new Date().toISOString(), registradoPorNome: currentUser?.nome || 'Anônimo', papel: currentUser?.papel || 'visitante' } as any, ...offerings]);
              setForm({ cat: 'oferta', tipo: 'entrada', valor: '', obs: '' });
              alert('Registro financeiro salvo!');
            }} className="w-full bg-green-600 text-white p-6 rounded-2xl font-black text-2xl shadow-xl hover:bg-green-700 transition-all hover:scale-[1.02]">REGISTRAR VALOR</button>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border-4 border-gray-50 shadow-xl flex flex-col justify-center">
            <h3 className="font-black text-gray-400 mb-8 uppercase tracking-[0.2em] text-sm text-center">Balanço do Ministério</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center text-xl">
                <span className="text-gray-400 font-bold">ENTRADAS:</span>
                <span className="text-green-600 font-black">R$ {financeTotals.entries.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xl">
                <span className="text-gray-400 font-bold">SAÍDAS:</span>
                <span className="text-red-600 font-black">R$ {financeTotals.exits.toFixed(2)}</span>
              </div>
              <div className="border-t-4 border-dashed border-gray-100 pt-8 flex justify-between items-center">
                <span className="text-gray-900 font-black text-2xl uppercase tracking-tighter">Saldo Geral:</span>
                <span className={`text-4xl font-black p-4 rounded-3xl ${financeTotals.balance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  R$ {financeTotals.balance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto bg-white rounded-[2rem] border-4 border-gray-50 shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b-2 border-gray-100"><tr className="border-b"><th className="p-6 font-black uppercase text-xs text-gray-400">Data</th><th className="p-6 font-black uppercase text-xs text-gray-400">Descrição</th><th className="p-6 font-black uppercase text-xs text-gray-400 text-right">Valor</th></tr></thead>
            <tbody className="divide-y-2 divide-gray-50">
              {offerings.length === 0 ? (
                <tr><td colSpan={3} className="p-10 text-center text-gray-400 font-bold italic">Nenhum registro encontrado.</td></tr>
              ) : (
                offerings.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-6 text-xs font-black text-gray-300">{new Date(o.criadoEm).toLocaleDateString()}</td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-black text-indigo-900 uppercase text-xs tracking-widest">{o.categoria} • {o.tipo}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">Registrado por {o.registradoPorNome}</span>
                      </div>
                    </td>
                    <td className={`p-6 text-right font-black text-xl ${o.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {o.tipo === 'entrada' ? '+' : '-'} R$ {o.valor.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AreaContainer>
    );
  };

  const FeedArea = () => {
    const [msg, setMsg] = useState({ texto: '', publico: false, tipo: 'aviso' as const, mencoes: '' });
    return (
      <AreaContainer title={profileFilter ? `Postagens de ${profileFilter}` : "Feed de Notícias"} icon={Newspaper}>
        {profileFilter && (
          <div className="mb-10 flex items-center justify-between bg-indigo-600 text-white p-6 rounded-[2rem] shadow-xl animate-in fade-in slide-in-from-top-6 duration-500">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white text-indigo-600 rounded-full flex items-center justify-center font-black text-2xl">
                {profileFilter[0]}
              </div>
              <div>
                <p className="font-black text-xl uppercase tracking-tighter">FILTRANDO PERFIL</p>
                <p className="text-sm opacity-80 font-bold tracking-widest">{profileFilter}</p>
              </div>
            </div>
            <button 
              onClick={() => setProfileFilter(null)}
              className="flex items-center gap-2 bg-white/20 px-6 py-3 rounded-2xl text-sm font-black hover:bg-white/30 transition-all border border-white/10"
            >
              <X size={20} /> LIMPAR FILTRO
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border-4 border-cyan-50 shadow-2xl sticky top-28">
              <h3 className="font-black text-cyan-600 mb-8 flex items-center gap-3 text-2xl uppercase tracking-tighter"><PlusCircle size={32} /> Nova Postagem</h3>
              <textarea 
                value={msg.texto} 
                onChange={e => setMsg({...msg, texto: e.target.value})} 
                className="w-full p-5 border-2 border-gray-100 rounded-[2rem] mb-6 focus:ring-8 ring-cyan-50 outline-none bg-gray-50 h-56 resize-none font-medium text-lg" 
                placeholder="O que está acontecendo no ministério?"
              ></textarea>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 ml-3 uppercase tracking-[0.2em]">CATEGORIA DO POST</label>
                  <select value={msg.tipo} onChange={e => setMsg({...msg, tipo: e.target.value as any})} className="w-full p-4 border-2 border-gray-100 rounded-2xl bg-white outline-none focus:ring-4 ring-cyan-50 font-bold">
                    <option value="aviso">📢 AVISO GERAL</option><option value="evento">🎉 EVENTO / FESTA</option><option value="escala">📋 ESCALA / SERVIÇO</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 ml-3 uppercase tracking-[0.2em]">MARCAR PESSOAS</label>
                  <input value={msg.mencoes} onChange={e => setMsg({...msg, mencoes: e.target.value})} className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:ring-4 ring-cyan-50 font-bold" placeholder="Ex: Agatha, Alicya..." />
                </div>
                <label className="flex items-center gap-4 cursor-pointer p-4 hover:bg-gray-50 rounded-[1.5rem] transition-all border-2 border-transparent hover:border-cyan-50">
                  <input type="checkbox" checked={msg.publico} onChange={e => setMsg({...msg, publico: e.target.checked})} className="w-6 h-6 accent-cyan-600 rounded-lg" /> 
                  <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Compartilhar com os Pais</span>
                </label>
                <button onClick={() => {
                   if(!msg.texto) return alert('Texto vazio!');
                   setFeed([{ id: `fd-${Date.now()}`, ...msg, mencionados: msg.mencoes.split(',').filter(Boolean), criadoEm: new Date().toISOString(), criadoPorNome: currentUser?.nome || 'Visitante', reacoes: { gostei: 0, coracao: 0, festa: 0 }, comentarios: [], usuariosQueReagiram: {} }, ...feed]);
                   setMsg({ texto: '', publico: false, tipo: 'aviso', mencoes: '' });
                   alert('Postado no Feed!');
                }} className="w-full bg-cyan-600 text-white p-6 rounded-3xl font-black text-2xl shadow-xl hover:bg-cyan-700 transition-all active:scale-95">PUBLICAR AGORA</button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-10">
            {visibleFeed.map(item => <FeedCard key={item.id} item={item} />)}
            {visibleFeed.length === 0 && (
              <div className="bg-white/50 border-8 border-dashed rounded-[4rem] py-32 text-center opacity-40">
                <Newspaper size={80} className="mx-auto text-gray-300 mb-6" />
                <p className="text-gray-400 font-black text-2xl uppercase tracking-[0.3em]">Nada para mostrar</p>
              </div>
            )}
          </div>
        </div>
      </AreaContainer>
    );
  };

  const Home = () => (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-24">
        <div className="inline-block p-2 px-8 mb-10 rounded-full bg-white/10 border-2 border-white/20 backdrop-blur-xl animate-pulse">
          <p className="text-white font-black text-xs uppercase tracking-[0.4em]">Portal Gestão Kids</p>
        </div>
        <p className="text-4xl md:text-7xl italic text-white drop-shadow-2xl font-black mb-20 leading-[1.1] max-w-4xl mx-auto tracking-tighter">
          "Ensina a criança no caminho em que deve andar..." 
          <span className="text-2xl font-bold block mt-8 opacity-90 not-italic tracking-[0.3em] uppercase">— Provérbios 22:6</span>
        </p>
        <button 
          onClick={() => { const el = document.getElementById('main-menu'); if(el) el.scrollIntoView({ behavior: 'smooth' }); }} 
          className="group relative bg-white text-[#4B1E6D] px-20 py-8 rounded-full text-3xl font-black shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-110 hover:-rotate-2 transition-all active:scale-95 overflow-hidden"
        >
          <span className="relative z-10 uppercase tracking-tighter">INICIAR SESSÃO</span>
          <div className="absolute inset-0 bg-gradient-to-r from-pink-50 to-indigo-50 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
        </button>
      </div>
      <div id="main-menu" className="scroll-mt-40"><MenuGrid /></div>
      <Mural />
      <footer className="mt-40 text-center space-y-4">
        <div className="inline-block px-12 py-5 bg-black/10 backdrop-blur-2xl rounded-full text-white/70 text-xs font-black uppercase tracking-[0.5em] border-2 border-white/5 shadow-2xl">
          MCI Kids • 2024 • Feito com Amor
        </div>
        <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest">Tecnologia para o Reino</p>
      </footer>
    </div>
  );

  return (
    <div className="min-h-screen pb-40 selection:bg-pink-300 selection:text-[#4B1E6D]">
      <Header />
      <main className="container mx-auto px-4 max-w-7xl">
        {currentArea === 'home' && <Home />}
        {currentArea === 'pais' && <PaisArea />}
        {currentArea === 'lider' && <LiderArea />}
        {currentArea === 'auxiliar' && <AuxiliarArea />}
        {currentArea === 'presenca' && <PresencaArea />}
        {currentArea === 'oferta' && <OfertaArea />}
        {currentArea === 'feed' && <FeedArea />}
        {currentArea === 'arquivos' && (
          <AreaContainer title="Biblioteca do Ministério" icon={Folder}>
             <div className="bg-yellow-50 p-24 rounded-[5rem] border-8 border-dashed border-yellow-200 text-center shadow-inner group">
               <div className="relative inline-block mb-10">
                 <Folder size={120} className="text-yellow-500 group-hover:scale-125 transition-transform duration-700" />
                 <Save size={40} className="absolute bottom-0 right-0 text-yellow-600 bg-white rounded-full p-2 border-4 border-yellow-50" />
               </div>
               <p className="text-yellow-800 font-black text-4xl uppercase tracking-tighter">Espaço de Materiais</p>
               <p className="text-gray-400 mt-8 text-xl max-w-lg mx-auto font-medium">Aqui os coordenadores poderão subir arquivos PDF, imagens de lições e escalas de serviço.</p>
               <button onClick={() => setCurrentArea('home')} className="mt-16 bg-gradient-to-br from-yellow-500 to-orange-600 text-white px-16 py-6 rounded-[2rem] font-black text-2xl hover:scale-110 active:scale-95 shadow-[0_15px_40px_rgba(234,179,8,0.4)] transition-all">VOLTAR À HOME</button>
             </div>
          </AreaContainer>
        )}
      </main>
    </div>
  );
};

export default App;
