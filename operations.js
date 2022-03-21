// lista_responsaveis = []
// lista_beneficiarios = []
// outras_linhas = []

const criarHeaderTabela = () => {  
  const newHeader = document.createElement('tr')
  newHeader.innerHTML = `
      <td style="font-weight: bold;">Nome do Arquivo</td>
      <td style="font-weight: bold;">Tamanho do Arquivo</td>
  `
  document.querySelector('.registros>tbody').appendChild(newHeader)
}

const criarLinha = (file, index) => {  
  const newRow = document.createElement('tr')
  file_size = file.size;
  newRow.setAttribute("id", `arquivo-${index}`)
  newRow.innerHTML = `
      <td>${file.name}</td>
      <td>${humanFileSize(file.size, true)}</td>
  `
  document.querySelector('.registros>tbody').appendChild(newRow)
}

const limparTabela = () => {
  let el = document.querySelector('#unificar')
  if (el){
    el.remove()
  }
  const rows = document.querySelectorAll('.registros>tbody tr');
  rows.forEach(row => row.parentNode.removeChild(row));
}

function saveStaticDataToFile(lista) {
  const d = new Date()

  month = '' + (d.getMonth() + 1);
  day = '' + d.getDate();
  year = d.getFullYear();

  if (month.length < 2){
    month = '0' + month;
  }
  if (day.length < 2){
    day = '0' + day;
  }

  let filename = `DMED_Unificada_${year}-${month}-${day}.txt` 
  
  var blob = new Blob([lista],
      { type: "text/plain;charset=utf-8" });
  saveAs(blob, filename);
}

function readFileAsText(file){
  return new Promise(function(resolve,reject){
      let fr = new FileReader();

      fr.onload = function(){
          resolve(fr.result);
      };

      fr.onerror = function(){
          reject(fr);
      };

      fr.readAsText(file);
  });
}

function humanFileSize(bytes, si=false, dp=1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si 
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] 
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10**dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


  return bytes.toFixed(dp) + ' ' + units[u];
}

// Handle multiple fileuploads
document.querySelector(".inputfile").addEventListener("change", function(ev){
  let files = ev.currentTarget.files;
  let readers = [];

  // Abort if there were no files selected
  if(!files.length) return;

  lista_responsaveis = []
  lista_beneficiarios = []
  outras_linhas = []
  limparTabela()
  criarHeaderTabela()

  for (let i = 0; i < files.length; i++) {
    //console.log(arquivos[i])
    criarLinha(files[i], i)
  }

  // Store promises in array
  for(let i = 0;i < files.length;i++){
      readers.push(readFileAsText(files[i]));
  }
  
  // Trigger Promises
  Promise.all(readers).then((values) => {
      // Values will be an array that contains an item
      // with the text of every selected file
      // ["File1 Content", "File2 Content" ... "FileN Content"]
      // console.log(values);
      values.forEach(carregarListas)
      criarBotaoUnificar()
  });
}, false);


function carregarListas(file) {

  var fileContentArray = file.split(/\r\n|\n/);
  for(var line = 0; line < fileContentArray.length-1; line++){
    
    // VERIFICA SE A LINHA É DO RESPONSÁVEL
    if (fileContentArray[line].match("RPPSS") && !fileContentArray[line].match("BRPPSS")){
      
      dados_responsavel = fileContentArray[line].split('|');
      cpf_responsavel = dados_responsavel[1]
      nome_responsavel = dados_responsavel[2]
      if (dados_responsavel[3] === ''){
        valor_responsavel = 0
      } else {
        valor_responsavel = parseInt(dados_responsavel[3])
      }

      // console.log(line, "Responsável: ", nome_responsavel)        
      lista_responsaveis.push({"cpf": cpf_responsavel, "nome": nome_responsavel, "valor": valor_responsavel});
    
      // VERIFICA SE A LINHA É DO BENEFICIARIO
    } else if (fileContentArray[line].match("BRPPSS")){
      
      dados_beneficiario = fileContentArray[line].split('|');
      if (dados_beneficiario[1] === ''){
        cpf_beneficiario = '00000000000'
      } else {
        cpf_beneficiario = dados_beneficiario[1]
      }
      if (dados_beneficiario[2] === ''){
        data_nasc_beneficiario = '00000000'
      } else {
        data_nasc_beneficiario = dados_beneficiario[2]
      }
      nome_beneficiario = dados_beneficiario[3]
      if (dados_beneficiario[4] === ''){
        valor_beneficiario = 0
      } else {
        valor_beneficiario = parseInt(dados_beneficiario[4])
      }

      // console.log(line, "Beneficiário: ", nome_beneficiario, "| Responsável: ", nome_responsavel)
      lista_beneficiarios.push({"cpf_responsavel": cpf_responsavel, "cpf": cpf_beneficiario, "data_nasc": data_nasc_beneficiario, "nome": nome_beneficiario, "valor": valor_beneficiario});
      // debugger
    } else {
      //console.log(fileContentArray[line]);
      outras_linhas.push(fileContentArray[line]);
    }
  }
  // debugger
}


function unificaResponsaveis(lista) {
  var result = [];
  lista.reduce(function(res, value) {
    if (!res[value.cpf]) {
      res[value.cpf] = { cpf: value.cpf, nome: value.nome, valor: 0 };
      result.push(res[value.cpf])
    }
    res[value.cpf].valor += value.valor;
    return res;
  }, {});

  result.sort(function(a, b){return a.cpf - b.cpf});
  return result
}

function unificaBeneficiarios(lista) {
  var result = [];
  lista.reduce(function(res, value) {
    if (!res[value.cpf_responsavel]) {
      res[value.cpf_responsavel] = { cpf_responsavel: value.cpf_responsavel, cpf: value.cpf, data_nasc: value.data_nasc, nome: value.nome, valor: 0 };
      result.push(res[value.cpf_responsavel])
    }
    res[value.cpf_responsavel].valor += value.valor;
    return res;
  }, {});

  // console.log(result)
  return result
}

function unificarDmed(responsaveis, beneficiarios) {
  let lista_unificada = []

  cabecalho = "Dmed|2022|2021|N||S2000K|\nRESPO|41482939096|FULANA DE TAL|51|35501234||||\nDECPJ|87649651000195|EMPRESA FICTICIA UNIFICADA|1|||41482939096|N|||\nPSS|"

  lista_unificada.push(cabecalho)
  
  for (let responsavel of responsaveis) {
    // console.log(responsavel)
    // console.log("RPPSS|" + responsavel.cpf + "|" + responsavel.nome + "|" + ((responsavel.valor === 0) ? "" : responsavel.valor) + "|")
    lista_unificada.push("RPPSS|" + responsavel.cpf + "|" + responsavel.nome + "|" + ((responsavel.valor === 0) ? "" : responsavel.valor) + "|")
    // lista_unificada.push(responsavel)
    for (let beneficiario of beneficiarios) {
      if (beneficiario.cpf_responsavel === responsavel.cpf){
        // console.log(beneficiario)
        // console.log("BRPPSS|" + ((beneficiario.cpf === "00000000000") ? "" : beneficiario.cpf) + "|" + ((beneficiario.data_nasc === "00000000") ? "" : beneficiario.data_nasc) + "|" + beneficiario.nome + "|" + ((beneficiario.valor === 0) ? "" : beneficiario.valor) + "|")
        lista_unificada.push("BRPPSS|" + ((beneficiario.cpf === "00000000000") ? "" : beneficiario.cpf) + "|" + ((beneficiario.data_nasc === "00000000") ? "" : beneficiario.data_nasc) + "|" + beneficiario.nome + "|" + ((beneficiario.valor === 0) ? "" : beneficiario.valor) + "|")
        // lista_unificada.push(beneficiario)
      }
    }
  }
  lista_unificada.push("FIMDmed|")
  return lista_unificada
}

function convertListToString(lista){
  let lista_convertida = lista.join();
  let lista_final = lista_convertida.split(",").join("\n");
  return lista_final
}

function criarBotaoUnificar(){
  const newButton = document.createElement('div');
  newButton.setAttribute('class', 'box');
  newButton.innerHTML = `
    <button type="button" class="button green" id="unificar">Unificar</button>
  `
  document.querySelector(".conteudo").appendChild(newButton)
  document.querySelector('#unificar').addEventListener('click', function() {
    let responsaveis = unificaResponsaveis(lista_responsaveis)
    let beneficiarios = unificaBeneficiarios(lista_beneficiarios)
    let lista_unificada = unificarDmed(responsaveis, beneficiarios)
    saveStaticDataToFile(convertListToString(lista_unificada))
  })
}