document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  applySavedTheme();
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  await renderProfile();
});

async function renderProfile() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    document.getElementById('profileContent').innerHTML = '<p>ID do funcionário não especificado.</p>';
    return;
  }

  // Buscar funcionário e períodos de férias
  const { data: emp, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  const { data: periods, error: periodsError } = await supabase
    .from('vacation_periods')
    .select('*')
    .eq('employee_id', id)
    .order('start_date', { ascending: true });

  if (empError || !emp) {
    document.getElementById('profileContent').innerHTML = '<p>Funcionário não encontrado.</p>';
    return;
  }

  const status = emp.on_vacation ? "Em Férias" : (calcDisponibilidade(emp.hire_date, emp.last_vacation) ? "Férias Disponíveis" : "Indisponível");
  const today = new Date();
  
  // Encontrar período ativo de férias
  let activePeriod = null;
  if (periods && !periodsError) {
    activePeriod = periods.find(p => {
      const start = new Date(p.start_date);
      const end = new Date(start);
      end.setDate(start.getDate() + p.days);
      return today >= start && today <= end;
    });
  }

  let progressHTML = '';
  if (activePeriod) {
    const start = new Date(activePeriod.start_date);
    const end = new Date(start);
    end.setDate(start.getDate() + activePeriod.days);
    const daysPassed = Math.floor((today - start) / 86400000) + 1;
    const daysRemaining = activePeriod.days - daysPassed;
    const progress = Math.min(100, (daysPassed / activePeriod.days) * 100);

    progressHTML = `
      <h2><i class='fas fa-chart-line'></i> Progresso das Férias</h2>
      <div class="progress-container">
        <div class="progress-header">
          <span>${formatDate(start)}</span>
          <span>${formatDate(end)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${progress}%; background: linear-gradient(90deg, var(--primary), var(--success));">
            ${progress.toFixed(0)}%
          </div>
        </div>
      </div>
      <div class="vacation-stats">
        <div class="stat">
          <h3>Dias Decorridos</h3>
          <p class="days-passed">${daysPassed}</p>
        </div>
        <div class="stat">
          <h3>Dias Restantes</h3>
          <p class="days-remaining">${daysRemaining}</p>
        </div>
      </div>`;
  }

  // Gerar HTML do histórico de férias
  let historyHTML = `
    <div class="timeline-item">
      <div class="timeline-date">${formatDate(emp.hire_date)}</div>
      <div class="timeline-content">Contratação</div>
    </div>`;

  if (periods && !periodsError) {
    historyHTML += periods.map(p => `
      <div class="timeline-item">
        <div class="timeline-date">${formatDate(p.start_date)}</div>
        <div class="timeline-content">${p.days} dias de férias</div>
      </div>
    `).join('');
  }

  // Montar o HTML completo
  document.getElementById('profileContent').innerHTML = `
    <div class="profile-header">
      <div class="profile-photo">
        ${emp.photo ? `<img src="${emp.photo}" alt="${emp.name}">` : '<i class="fas fa-user"></i>'}
      </div>
      <div class="profile-info">
        <h1>${emp.name}</h1>
        <div class="profile-details">
          <div class="detail-item"><i class="fas fa-id-card"></i> ${emp.matricula}</div>
          <div class="detail-item"><i class="fas fa-user-tag"></i> ${formatStatus(emp.status)}</div>
          <div class="detail-item"><i class="fas fa-users"></i> Frente ${emp.team}</div>
          <div class="detail-item">
            <i class="fas fa-clock"></i>
            <span class="badge ${emp.on_vacation ? 'badge-success' : (calcDisponibilidade(emp.hire_date, emp.last_vacation) ? 'badge-primary' : 'badge-warning')}">${status}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-grid">
      <div class="card">
        <h2><i class="fas fa-info-circle"></i> Informações Pessoais</h2>
        <div class="info-item"><label>Telefone</label><p>${emp.phone || 'Não informado'}</p></div>
        <div class="info-item"><label>Data de Contratação</label><p>${formatDate(emp.hire_date)}</p></div>
        <div class="info-item"><label>Últimas Férias</label><p>${emp.last_vacation ? formatDate(emp.last_vacation) : 'Nunca tirou férias'}</p></div>
      </div>

      <div class="card">
        ${progressHTML}
        <h2 style="margin-top: 2rem;"><i class="fas fa-history"></i> Histórico</h2>
        <div class="timeline">
          ${historyHTML}
        </div>
      </div>
    </div>
  `;
}