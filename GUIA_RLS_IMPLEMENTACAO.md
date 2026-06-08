# 🔐 Guia de Implementação: Row Level Security (RLS)

## O que é RLS?

Row Level Security (RLS) garante que cada usuário veja **apenas os dados que tem permissão** de acessar. Não é apenas uma questão de ocultar dados na UI - é uma proteção no **nível do banco de dados**.

---

## 📋 Arquitetura de Permissões

### **Admin**
- ✅ Acesso total a todas as tabelas
- ✅ Criar/editar/deletar qualquer dado

### **Pastor**
- ✅ Acesso total aos dados da igreja
- ✅ Criar avisos
- ✅ Gerenciar usuários

### **Secretário**
- ✅ Acesso total aos dados da igreja
- ✅ Gerenciar pessoas, grupos, ministérios
- ❌ Não pode criar avisos
- ❌ Não pode gerenciar usuários

### **Líder de Grupo**
- ✅ Vê apenas seu grupo e membros
- ✅ Pode editar membros de seu grupo
- ❌ Vê membros subordinados a ele

### **Líder de Ministério**
- ✅ Vê apenas seu ministério e membros
- ✅ Pode editar membros de seu ministério
- ❌ Vê membros subordinados a ele

---

## 🔧 Passo a Passo de Implementação

### **1. Preparar o Supabase**

1. Abra o **SQL Editor** do Supabase
2. Crie as tabelas necessárias (se não existirem):

```sql
-- Tabela de group_members
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, person_id)
);

-- Tabela de ministry_members
CREATE TABLE IF NOT EXISTS ministry_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id UUID NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ministry_id, person_id)
);
```

### **2. Executar as Políticas RLS**

1. Copie o conteúdo do arquivo `RLS_POLICIES.sql`
2. Cole no SQL Editor do Supabase
3. **Substitua** `'church_id' = auth.jwt() ->> 'church_id'` pelo ID real da sua igreja onde necessário
4. Clique em **Run** para executar

### **3. Configurar JWT Claims** (Importante!)

No Supabase, você precisa adicionar `church_id` ao JWT:

1. Vá em **Authentication** → **Providers** → **User Defined Claims**
2. Adicione:
```json
{
  "church_id": "90e649c3-13ea-4fdc-a1c8-f352ef794b20"
}
```

Ou use uma função trigger para adicionar automaticamente:

```sql
CREATE OR REPLACE FUNCTION public.update_user_jwt()
RETURNS TRIGGER AS $$
BEGIN
  -- Adicionar church_id do usuário ao JWT
  NEW.raw_user_meta_data = jsonb_set(
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    '{church_id}',
    to_jsonb(NEW.church_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_jwt();
```

### **4. Testar as Políticas**

No Supabase, vá para a aba **SQL** e execute:

```sql
-- Verificar políticas ativas
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Teste: Veja como um usuário específico vê os dados
SELECT * FROM people WHERE church_id = '90e649c3-13ea-4fdc-a1c8-f352ef794b20';
```

---

## ⚠️ Considerações Importantes

### **Performance**
- RLS pode impactar queries complexas
- **Crie índices** nas colunas frequentemente filtradas:

```sql
CREATE INDEX idx_people_church_id ON people(church_id);
CREATE INDEX idx_people_responsible_id ON people(responsible_id);
CREATE INDEX idx_groups_leader_id ON groups(leader_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
```

### **Debugging**
Se uma query retornar erro de RLS:
1. Verifique se o usuário tem permissão
2. Verifique se `church_id` está correto no JWT
3. Verifique se as políticas estão ativas
4. Use `SET ROLE` no SQL para testar como outro usuário

### **Desabilitar RLS (apenas para testes)**
```sql
ALTER TABLE people DISABLE ROW LEVEL SECURITY;
```

---

## 📝 Checklist Final

- [ ] Tabelas `group_members` e `ministry_members` criadas
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas SQL executadas
- [ ] JWT Claims configurados com `church_id`
- [ ] Índices criados para performance
- [ ] Testes realizados com diferentes papéis
- [ ] Documentação atualizada
- [ ] Backup feito

---

## 🚀 Próximas Etapas

Após implementar RLS:
1. Atualizar serviços para remover filtros manuais (RLS faz isso agora)
2. Adicionar auditoria de acesso
3. Monitorar performance
4. Documentar permissões para usuários

---

**Status**: 📋 Pronto para implementação
