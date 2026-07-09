import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { getGroupHierarchyTree, getGroupLeaderStats } from '@/services/organogram';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
interface TreeNode {
  id: string;
  name: string;
  leader?: { id: string; full_name: string } | null;
  status: string;
  children: TreeNode[];
}
interface ExpandedNodes {
  [key: string]: boolean;
}
export default function Organogram() {
  const router = useRouter();
  const { user, church_id } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<ExpandedNodes>({});
  const [stats, setStats] = useState<{ [key: string]: any }>({});
  useEffect(() => {
    if (!user) return;
    loadOrganogram();
  }, [user]);
  const loadOrganogram = async () => {
    setLoading(true);
    try {
      const churchId = church_id || '';
      const { data, error } = await getGroupHierarchyTree(churchId);
      if (error) throw error;
      setTree(data || []);
      // Carregar stats para os grupos
      if (data) {
        const statsMap: { [key: string]: any } = {};
        for (const node of data) {
          const stat = await getGroupLeaderStats(node.id);
          statsMap[node.id] = stat;
        }
        setStats(statsMap);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };
  const TreeNode = ({ node, depth = 0 }: { node: TreeNode; depth?: number }) => {
    const isExpanded = expandedNodes[node.id];
    const hasChildren = node.children.length > 0;
    const nodeStat = stats[node.id];
    return (
      <div key={node.id} style={{ marginLeft: `${depth * 24}px` }}>
        <div className="flex items-center gap-2 py-3 px-3 bg-white dark:bg-slate-800 rounded-lg mb-2 border border-gray-200 dark:border-slate-700 hover:border-primary-300 hover:shadow-sm transition-all">
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-primary-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          <div
            className="flex-1 cursor-pointer hover:text-primary-600"
            onClick={() => router.push(`/groups/${node.id}`)}
          >
            <p className="font-semibold text-gray-950 dark:text-white">👥 {node.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {node.leader ? `Líder: ${node.leader.full_name}` : 'Sem líder designado'}
            </p>
          </div>
          {nodeStat && nodeStat.direct_subgroups > 0 && (
            <div className="flex items-center gap-1 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">
              <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                {nodeStat.direct_subgroups}
              </span>
            </div>
          )}
        </div>
        {isExpanded && hasChildren && (
          <div className="border-l-2 border-gray-200 dark:border-slate-700 ml-6 pl-2">
            {node.children.map((child) => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };
  if (!user) return null;
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-950 dark:text-white">Organograma 🏛️</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Estrutura hierárquica da sua igreja</p>
      </div>
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando organograma...</p>
        </div>
      ) : tree.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhum grupo cadastrado ainda</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Crie grupos e defina a hierarquia para visualizar o organograma
          </p>
          <button
            onClick={() => router.push('/groups/new')}
            className="mt-4 text-primary-600 hover:underline font-medium"
          >
            Criar Novo Grupo
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="space-y-1">
            {tree.map((node) => (
              <TreeNode key={node.id} node={node} />
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-gray-300 dark:border-slate-700">
            <h3 className="text-lg font-bold text-gray-950 dark:text-white mb-4">Resumo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 dark:text-gray-400">Níveis de Grupos</p>
                <p className="text-3xl font-bold text-primary-600 mt-2">
                  {Math.max(...tree.map(() => 1))}+
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 dark:text-gray-400">Grupos Principais</p>
                <p className="text-3xl font-bold text-primary-600 mt-2">{tree.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Grupos</p>
                <p className="text-3xl font-bold text-primary-600 mt-2">
                  {tree.reduce((sum, node) => sum + 1 + (stats[node.id]?.total_team || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
