-- ==============================================
-- Marmita Planner - Supabase Database Schema
-- ==============================================

-- Tabela de Ingredientes
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('g', 'ml', 'un', 'colher', 'xícara')),
  category TEXT NOT NULL CHECK (category IN ('Proteína', 'Carboidrato', 'Vegetal', 'Fruta', 'Tempero/Outros', 'Laticínios')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Receitas
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  yield INTEGER NOT NULL CHECK (yield > 0),
  prep_time_minutes INTEGER NOT NULL CHECK (prep_time_minutes > 0),
  instructions TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT 'Gustavo' CHECK (owner IN ('Luiza', 'Gustavo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Ingredientes por Receita (relacionamento many-to-many)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (recipe_id, ingredient_id)
);

-- Tabela de Planejamento Semanal
CREATE TABLE IF NOT EXISTS weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day TEXT NOT NULL CHECK (day IN ('Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta')),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  servings INTEGER NOT NULL CHECK (servings > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_day ON weekly_plans(day);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_plans_updated_at BEFORE UPDATE ON weekly_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo (opcional)
INSERT INTO ingredients (name, unit, category) VALUES
  ('Arroz Integral', 'g', 'Carboidrato'),
  ('Peito de Frango', 'g', 'Proteína'),
  ('Brócolis', 'un', 'Vegetal'),
  ('Azeite de Oliva', 'ml', 'Tempero/Outros')
ON CONFLICT DO NOTHING;

-- Comentários nas tabelas
COMMENT ON TABLE ingredients IS 'Ingredientes cadastrados no sistema';
COMMENT ON TABLE recipes IS 'Receitas cadastradas com instruções';
COMMENT ON TABLE recipe_ingredients IS 'Relacionamento entre receitas e ingredientes com quantidades';
COMMENT ON TABLE weekly_plans IS 'Planejamento semanal de receitas';
