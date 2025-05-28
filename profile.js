document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  applySavedTheme();
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  loadProfile();
});

function loadProfile() {
  const id = localStorage.getItem('currentEmployee');
  const employees = JSON.parse(localStorage.getItem('employees')) || [];
  const emp = employees.find(e => e.id === id);

  const container = document.getElementById('profileContent');

  if (!emp) {
    container.innerHTML = `<p>Funcionário não encontrado.</p>`;
    return;
  }

  const hireDate = formatDate(emp.hireDate);
  const lastVacation = emp.lastVacation ? formatDate(emp.lastVacation) : 'N/A';
  const available = emp.onVacation ? 'Em férias' : calcAvailability(emp) ? 'Disponível' : 'Indisponível';

  container.innerHTML = `
    <div class="employee-card" style="max-width:600px;margin:auto;">
      <div class="employee-photo" style="height:200px;">
        ${emp.photo ? `<img src="${emp.photo}" alt="${emp.name}">` : '<i class="fas fa-user"></i>'}
      </div>
      <div class="employee-info" style="text-align:center;">
        <h3 class="employee-name">${emp.name}</h3>
        <p><strong>Matrícula:</strong> ${emp.matricula}</p>
        <p><strong>Status:</strong> ${formatStatus(emp.status)}</p>
        <p><strong>Frente:</strong> ${emp.team}</p>
        <p><strong>Data de Contratação:</strong> ${hireDate}</p>
        <p><strong>Últimas Férias:</strong> ${lastVacation}</p>
        <p><strong>Situação de Férias:</strong> ${available}</p>
      </div>

      ${emp.onVacation ? renderProgress(emp) : ''}

      <div style="margin:2rem 0;">
        <h3><i class="fas fa-history"></i> Histórico</h3>
        <ul style="list-style:none;padding:0;">
          <li><i class="fas fa-play"></i> Contratado em ${hireDate}</li>
          <li><i class="fas fa-plane-departure"></i> Últimas férias: ${lastVacation}</li>
          ${emp.onVacation ? `<li><i class="fas fa-umbrella-beach"></i> Férias atuais: ${formatDate(emp.vacationStartDate)} (${emp.totalVacationDays} dias)</li>` : ''}
        </ul>
      </div>
    </div>
  `;
}

function renderProgress(emp) {
  const start = new Date(emp.vacationStartDate);
  const end = new Date(start);
  end.setDate(start.getDate() + emp.totalVacationDays);
  const today = new Date();

  let daysPassed = 0, daysRemaining = emp.totalVacationDays, progress = 0;

  if (today > end) {
    daysPassed = emp.totalVacationDays;
    daysRemaining = 0;
    progress = 100;
  } else if (today >= start) {
    daysPassed = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
    daysRemaining = emp.totalVacationDays - daysPassed;
    progress = Math.min(100, (daysPassed / emp.totalVacationDays) * 100);
  }

  const barColor = progress >= 100 ? '#4cc9f0' :
                   progress >= 66 ? '#f8961e' :
                   progress >= 33 ? '#ffd166' : '#90be6d';

  return `
    <div class="progress-container" style="margin:1.5rem 0;">
      <div class="progress-header">
        <span>Progresso</span>
        <span>${progress.toFixed(0)}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${progress}%; background:${barColor};"></div>
      </div>
      <div class="vacation-days" style="margin-top:0.5rem;">
        <span class="days-passed">${daysPassed} dias</span>
        <span class="days-remaining">${daysRemaining} dias restantes</span>
      </div>
    </div>
  `;
}
