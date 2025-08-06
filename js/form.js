document.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  if (!user?.is_admin) {
    window.location.href = 'dashboard.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const employeeId = urlParams.get('id');

  // Configura upload de foto
  document.getElementById('uploadBtn').addEventListener('click', () => {
    document.getElementById('photoInput').click();
  });

  document.getElementById('photoInput').addEventListener('change', handlePhotoUpload);

  if (employeeId) {
    await preencherFormulario(employeeId);
    document.getElementById('formTitle').textContent = 'Editar Funcionário';
  } else {
    document.getElementById('formTitle').textContent = 'Cadastrar Funcionário';
    document.getElementById('employeeId').value = '';
  }

  document.getElementById('employeeForm').addEventListener('submit', handleSubmit);
  document.getElementById('clearBtn').addEventListener('click', limparFormulario);
});

async function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Mostra preview
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('photoPreview').innerHTML = 
      `<img src="${e.target.result}" alt="Preview da foto">`;
  };
  reader.readAsDataURL(file);
}

async function handleSubmit(e) {
  e.preventDefault();
  
  try {
    const saveButton = document.getElementById('saveButton');
    saveButton.classList.add('loading');
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    const dados = obterDadosFormulario();
    if (!dados) return;

    // Upload da foto se existir
    const photoInput = document.getElementById('photoInput');
    if (photoInput.files[0]) {
      const file = photoInput.files[0];
      const fileName = `employee_${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('employee-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('employee-photos')
        .getPublicUrl(fileName);
      
      dados.photo = urlData.publicUrl;
    }

    const employeeId = document.getElementById('employeeId').value;
    if (employeeId) {
      await supabase
        .from('employees')
        .update(dados)
        .eq('id', employeeId);
      Swal.fire('Sucesso!', 'Funcionário atualizado com sucesso', 'success');
    } else {
      dados.created_by = user.id;
      await supabase
        .from('employees')
        .insert([dados]);
      Swal.fire('Sucesso!', 'Funcionário cadastrado com sucesso', 'success');
    }

    setTimeout(() => window.location.href = 'dashboard.html', 1500);
  } catch (error) {
    console.error('Erro ao salvar funcionário:', error);
    Swal.fire('Erro', error.message, 'error');
  } finally {
    const saveButton = document.getElementById('saveButton');
    saveButton.classList.remove('loading');
    saveButton.innerHTML = '<i class="fas fa-save"></i> Salvar Funcionário';
  }
}

function obterDadosFormulario() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const role = document.getElementById('role').value.trim();
  const team = document.getElementById('team').value.trim();
  const department = document.getElementById('department').value;
  const hire_date = document.getElementById('hire_date').value;
  const status = document.getElementById('status').value;
  
  // Validação básica
  if (!name || !email || !hire_date) {
    Swal.fire('Atenção', 'Por favor, preencha todos os campos obrigatórios', 'warning');
    return null;
  }

  if (!validateEmail(email)) {
    Swal.fire('Atenção', 'Por favor, insira um e-mail válido', 'warning');
    return null;
  }

  return {
    name,
    email,
    role,
    team,
    department,
    hire_date,
    status
  };
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

async function preencherFormulario(id) {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw error || new Error('Funcionário não encontrado');

    document.getElementById('employeeId').value = id;
    document.getElementById('name').value = data.name || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('role').value = data.role || '';
    document.getElementById('team').value = data.team || '';
    document.getElementById('department').value = data.department || '';
    document.getElementById('hire_date').value = data.hire_date || '';
    document.getElementById('status').value = data.status || '';

    if (data.photo) {
      document.getElementById('photoPreview').innerHTML = 
        `<img src="${data.photo}" alt="Foto do funcionário">`;
    }

  } catch (error) {
    console.error('Erro ao buscar funcionário:', error);
    Swal.fire('Erro', 'Não foi possível carregar os dados do funcionário', 'error');
    window.location.href = 'dashboard.html';
  }
}

function limparFormulario() {
  document.getElementById('employeeForm').reset();
  document.getElementById('photoPreview').innerHTML = '<i class="fas fa-user"></i>';
  document.getElementById('employeeId').value = '';
}