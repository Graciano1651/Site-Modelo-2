import { createClient } from 'https://cdn.jsdelivr.net/npm/_@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://kqvhbcbjrkyfknegnbce.supabase.co' ;
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdmhiY2Jqcmt5ZmtuZWduYmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NTg0NjUsImV4cCI6MjA2NDAzNDQ2NX0.6fHcOtVH59DVJ3J2KF19phtiCriAsHDr5vWLnxwW8kY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Função para buscar usuário pelo email
export async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) throw error;
  return data;
}

// Função para inserir novo funcionário
export async function insertEmployee(employee) {
  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Buscar todos os funcionários
export async function getAllEmployees() {
  const { data, error } = await supabase.from('employees').select('*');
  if (error) throw error;
  return data;
}

// Buscar funcionário por ID
export async function getEmployeeById(id) {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Atualizar funcionário
export async function updateEmployee(id, updates) {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Remover funcionário
export async function deleteEmployee(id) {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// Inserir período de férias
export async function insertVacationPeriod(period) {
  const { data, error } = await supabase
    .from('vacation_periods')
    .insert(period)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Buscar períodos de férias por ID do funcionário
export async function getVacationPeriodsByEmployeeId(employeeId) {
  const { data, error } = await supabase
    .from('vacation_periods')
    .select('*')
    .eq('employee_id', employeeId);

  if (error) throw error;
  return data;
}

// Buscar todos os períodos de férias
export async function getAllVacationPeriods() {
  const { data, error } = await supabase.from('vacation_periods').select('*');
  if (error) throw error;
  return data;
}

// Excluir período de férias
export async function deleteVacationPeriod(id) {
  const { error } = await supabase.from('vacation_periods').delete().eq('id', id);
  if (error) throw error;
  return true;
}
