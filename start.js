events.save = function() {
  localforage.setItem('hostTables', data)
}
events.reset = function() {
  localforage.setItem('hostTables', {})
  setTimeout(function() {
    location.reload()
  },50)
}
localforage.getItem('hostTables', function(err, obj) {
  if (err ||!obj || Object.keys(obj).length < 1) {
    window.data = {
      floors: ['Main Floor'],
      tables: [
        {name: '1', status: 'open',floor:0, seats: 2, loc: [4, 4, 5, 5, 'square'], section: false, server: false},
        {name: '2', status: 'open',floor:0, seats: 4, loc: [20, 20, 8, 8, 'square'], section: false, server: false},
      ],
      env: [],
      servers: [{name: 'Stacy'}, {name: 'Bob'}],
      activeServers: [],
      settings: {

      }
    }
  } else {
    window.data = obj
  }
  events.save()
  events.themes()
  events.renderFloors()
  events.renderStats()
})
events.themes = function() {
  if (!data.settings.theme) {
    data.settings.theme = 'default'
  }
  if (data.settings.theme) {
    if (data.settings.theme == 'shadow') {

    } else if (data.settings.theme == 'dark') {
      D.find('head').innerHTML += `
      <style>
      #left {
        background-color: #000;
      }
      #sideNav {
        background-color: #111;
        color: white;
      }
      .floor {
        background-color: #222;
      }
      .floorTitle {
        color: white;
      }
      .open {
        background-color: rgba(100,215,100,.9);
      }
      .dirty {
        background-color: rgba(198,142,14,.9);
      }
      .seated {
        background-color: rgba(255,100,100,.9);
      }
      .reserved {
        background: repeating-linear-gradient(135deg, rgba(255,165,0,.9), rgba(255,165,0,.9) .5rem,rgba(235,235,0,.9) .5rem, rgba(235,235,0,.9) 1rem) ;
      }
      .displaySeats {
        color: white;
        text-shadow: 0 0 2px black;
      }
      </style>
      `
    } else if (data.settings.theme == 'light') {
      D.find('head').innerHTML += `
      <style>
      #left {
        background-color: #fff;
      }
      #sideNav {
        background-color: #FDFDFD;
        color: black;;
      }
      .floor {
        background-color: #fcfcfc;
        border: .2rem outset #aaa;
      }
      .floorTitle {
        color: black;
      }
      .open {
        background-color: rgba(140,255,140,.9);
      }
      .dirty {
        background-color: rgba(198,142,14,.9);
      }
      .seated {
        background-color: rgba(255,100,100,.9);
      }
      .reserved {
        background: repeating-linear-gradient(135deg, rgba(255,165,0,.9), rgba(255,165,0,.9) .5rem,rgba(235,235,0,.9) .5rem, rgba(235,235,0,.9) 1rem) ;
      }
      .displaySeats {
        color: black;
        text-shadow: 0 0 2px white;
      }
      </style>
      `
    } else {
      D.find('head').innerHTML += `
      <style>
      #left {
        background-color: #ccc;
      }
      #sideNav {
        background-color: #FAFAFA;
        color: black;;
      }
      .floor {
        background-color: #F3f3f3;
      }
      .floorTitle {
        color: black;
      }
      .open {
        background-color: rgba(140,255,140,.9);
      }
      .dirty {
        background-color: rgba(198,142,14,.9);
      }
      .seated {
        background-color: rgba(255,100,100,.9);
      }
      .reserved {
        background: repeating-linear-gradient(135deg, rgba(255,165,0,.9), rgba(255,165,0,.9) .5rem,rgba(235,235,0,.9) .5rem, rgba(235,235,0,.9) 1rem) ;
      }
      .displaySeats {
        color: black;
        text-shadow: 0 0 2px white;
      }
      </style>
      `
    }
  }
}
{ //right
  let right = D.find('#sideNav')
  let stats = D.make('div')
  events.renderStats = function() {
    events.save()
    stats.innerHTML = ''
    let suggestedServer = D.make('div')
    stats.append(suggestedServer)
    if (data.activeServers.length) {
      data.activeServers.forEach(ele => {
        let current = 0;
        let currTables = 0;
        let recent = 0;
        let now = (new Date).getTime()
        let lastSeated = ele.lastSeated;
        data.tables.forEach(table=> {
          if (table.server == ele.name) {
            currTables += 1
            current += table.seated
            if (table.timeSeated > lastSeated) {
              lastSeated = table.timeSeated
            }
            if (now - table.timeSeated < 360000) {
              recent += .25;
              recent += ((1 -(now - table.timeSeated)/360100)**.5) * table.seated
            }
          }
        })
        ele.guests = current
        ele.tables = currTables
        ele.recent = recent
        ele.lastSeated = lastSeated
        let doubleMeter = D.make("meter", {
          value: `${(recent/12).toFixed(2)}`,
          style: 'width:3rem;',
          high: .75,
          optimum: .5
        })
        let line = D.make('div', {
          innerHTML: `<b>${ele.name}: </b><span style='display:inline-block;'>Section <span class='section${ele.section||'0'}' style='padding-left:.1rem;padding-right:.1rem'>${ele.section||'[none]'}</span></span><br>
          Current: G:${current}, T: ${currTables}<br>
          Recent: `,
          title: `last seated ${(((new Date).getTime() - ele.lastSeated)/60000).toFixed(1)} min ago`,
          style: 'margin-bottom:.15rem; cursor: pointer;',
          onclick: function() {
            let bg = D.make('div', {
              className: 'modalBG',
              onclick: function() {
                this.remove()
                events.renderStats()
              }
            })
            let modal = D.make("div", {
              className: 'modal',
              style: 'background-color: #FAFAFA;',
              onclick: function(e) {
                e.stopPropagation()
              },
              innerHTML: `<h2>Server: ${ele.name}</h2><br>
              Section: <input min=0 type='number' value='${ele.section}' id='setServerSection'><br>
              Day total of guests: <input type='number' id='setServerGuestTotal'><br>
              Day total of tables: <input type='number' id='setServerTableTotal'>`
            })
            modal.querySelector('#setServerSection').onchange = function() {
              ele.section = +this.value
            }
            modal.querySelector('#setServerGuestTotal').value = ele.dayTotal
            modal.querySelector('#setServerGuestTotal').onchange = function() {
              ele.dayTotal = +this.value
            }
            modal.querySelector('#setServerTableTotal').value = ele.dayTables
            modal.querySelector('#setServerTableTotal').onchange = function() {
              ele.dayTables = +this.value
            }
            bg.append(modal)

            D.find('body').append(bg)
          }
        })
        line.append(doubleMeter)
        line.innerHTML += `<br>Day Totals: G: ${ele.dayTotal||0}, T: ${ele.dayTables||0}`
        stats.append(line, D.make('hr'))
      })
      let activeServers = [...data.activeServers]
      let next = activeServers.sort(function(a, b) {return a.lastSeated - b.lastSeated}).map(item =>item.name)
      let least = activeServers.sort(function(a, b) {return a.dayTotal - b.dayTotal}).map(item =>item.name)
      let busiest = activeServers.sort(function(a, b) {return a.guests - b.guests}).map(item =>item.name)
      let recentSeated = activeServers.sort(function(a, b) {return a.recent - b.recent}).map(item =>item.name)
      let actors = {}
      data.activeServers.forEach(ele => {
        actors[ele.name] = 0
      })
      let factors = [next, least, busiest, recentSeated]
      factors.forEach(factor => {
        factor.forEach((name, i) => {
          actors[name] += i
        })
      })
      actors = Object.keys(actors).sort(function(a, b) {
        return actors[a] - actors[b]
      })
      suggestedServer.innerHTML = `Suggested next to seat: <b>${actors[0]}</b>`
      if (actors[1]) {
        suggestedServer.innerHTML += `, then <b>${actors[1]}`
      }
      suggestedServer.innerHTML += '<hr>'
    } else {
      stats.innerHTML += 'No servers currently on duty.'
    }
  }
  let openEdit = D.make('div', {
    innerText: 'Edit/Manage',
    className: 'btn',
    style: 'margin-top:.5rem;',
    onclick: function() {
      edit.classList.toggle('hidden')
      D.find('#sideNav').scroll(0,1000)
    }
  })
  let edit = D.make('div', {
    className: 'hidden',
  })
  let createTable = D.make('button', {
    innerText: 'Create Table',
    onclick: function() {
      let table = {name: data.tables.length+1, status: 'open',floor:0, seats: 2, loc: [0, 0, 5, 5, 'square'], section: false, server: false}
      Object.assign(table, data.lastTableCreated)
      table.loc[0] = 0; table.loc[1] = 0;
      data.tables.push(table)
      let ref = events.renderTable(table)
      events.tableActions(table, ref)
      D.find('#editDimensions').click()
    }
  })
  let createObject = D.make('button', {
    innerText: 'Create Object',
    title: 'environment items like aquariums.',
    onclick: function() {
      let obj = {type: 'plant1', rotation: 0, loc: [0,0,6,6, 'square'], floor: 0}
      if (!Object.keys(data.env).length) data.env = []
      data.env.push(obj)
      let ref = events.renderObject(obj)
      events.objectActions(obj, ref)
    }
  })
  let createServer = D.make('button', {
    innerText: 'Create Server',
    onclick: function() {
      let bg = D.make('div', {
        className: 'modalBG',
        onclick: function() {
          this.remove()
        }
      })
      let modal = D.make("div", {
        className: 'modal',
        style: '',
        onclick: function(e) {
          e.stopPropagation()
        },
        innerHTML: `<h2>Add New Server to Database</h2>
        <form id='addServerForm'>
        <label>Name: </label><input id='serverName' type='text'><br>
        <input type='submit' value='Submit'></form>`
      })
      modal.querySelector('#addServerForm').onsubmit = function(e) {
        e.preventDefault()
        let name = D.find('#serverName').value
        if (name) {
          data.servers.push({name: name, created: (new Date).toLocaleDateString()})
          bg.remove()
        }
      }
      bg.append(modal)

      D.find('body').append(bg)
    }
  })
  let createFloor = D.make('button', {
    innerText: 'Create Floor',
    onclick: function() {
      let bg = D.make('div', {
        className: 'modalBG',
        onclick: function() {
          this.remove()
        }
      })
      let modal = D.make("div", {
        className: 'modal',
        style: '',
        onclick: function(e) {
          e.stopPropagation()
        },
        innerHTML: `<form id='floorForm'>
        <h2>Add New Floor to Database</h2>
        <label>Name: </label><input id='floorName' type='text'><br><input type='submit' value='Submit'>
        </form>`
      })
      modal.querySelector('#floorForm').onsubmit = function(e) {
        e.preventDefault()
        let name = D.find('#floorName').value
        if (name) {
          data.floors.push(name)
          bg.remove()
          events.renderFloors()
        }
      }
      bg.append(modal)

      D.find('body').append(bg)
    }
  })
  let deleteFloor = D.make('button', {
    innerText: 'Delete Floor',
    className: 'btnWarn',
    onclick: function() {
      let bg = D.make('div', {
        className: 'modalBG',
        onclick: function() {
          this.remove()
        }
      })
      let modal = D.make("div", {
        className: 'modal',
        style: 'background-color:#fafafa;',
        onclick: function(e) {
          e.stopPropagation()
        },
        innerHTML: `<form id='floorForm'>
        <h2>Delete floor</h2>
        <label>Name: </label><select id='deleteFloorSelect'></select><input type='submit' value='Submit'>
        </form>`
      })
      data.floors.forEach(ele=> {
        modal.querySelector('#deleteFloorSelect').append(D.make('option', {
          innerText: ele,
          value: ele
        }))
      })
      modal.querySelector('#floorForm').onsubmit = function(e) {
        e.preventDefault()
        let name = D.find('#deleteFloorSelect').value
        if (name) {
          let n;
          data.floors.forEach((ele,i)=> {
            if (ele == name) n = i
          })
          for (let x = 0; x < data.floors.length; x++) {
            if (data.floors[x] == name) {
              for (let i = data.tables.length-1;i >= 0; i--) {
                if (data.tables[i].floor == n) {
                  data.tables.splice(i,1)
                }
              }
              for (let i = data.env.length-1;i >= 0; i--) {
                if (data.env[i].floor == n) {
                  data.env.splice(i,1)
                }
              }
              data.floors.splice(n, 1)
              events.renderFloors()
              events.save()
              break;
            }
          }
        }
      }
      bg.append(modal)

      D.find('body').append(bg)
    }
  })
  let deleteServer = D.make('button', {
    innerText: 'Delete Server',
    className: 'btn btnWarn',
    onclick: function() {
      let bg = D.make('div', {
        className: 'modalBG',
        onclick: function() {
          this.remove()
        }
      })
      let modal = D.make("div", {
        className: 'modal',
        style: '',
        onclick: function(e) {
          e.stopPropagation()
        },
        innerHTML: `<h2>Permanently remove Server from Database</h2>
        <label>Name: </label><select id='serverName' ></select><br>`
      })
      let selectServer = modal.querySelector('#serverName')
      data.servers.forEach(ele=> {
        selectServer.append(D.make('option', {
          value: ele.name,
          innerText: ele.name
        }))
      })
      modal.append(D.make('button', {
        innerText: 'Submit',
        onclick: function() {
          let name = D.find('#serverName').value
          if (name) {
            data.servers.forEach((ele, i) => {
              if (ele.name==name) {
                data.servers.splice(i, 1)
              }
            })
            bg.remove()
          }
        }
      }))
      bg.append(modal)

      D.find('body').append(bg)
    }
  })
  let adjustActive = D.make('button', {
    innerText: 'Change active servers',
    onclick: function() {
      let bg = D.make('div', {
        className: 'modalBG',
        onclick: function() {
          this.remove();
          events.renderStats();
        }
      })
      let modal = D.make("div", {
        className: 'modal',
        style: 'display:flex; justify-content:space-around;',
        onclick: function(e) {
          e.stopPropagation()
        },
      })
      let active = D.make('div', {
        innerHTML: `<h2>Active/onfloor</h2>`
      })
      let inactive = D.make('div', {
        innerHTML: `<h2>inactive</h2>`
      })
      let renderServerList = function() {
        active.innerHTML = `<h2>Active/onfloor</h2>`
        inactive.innerHTML = `<h2>inactive</h2>`
        data.servers.forEach(ele => {
          for (let x = 0; x < data.activeServers.length; x++) {
            if (data.activeServers[x].name == ele.name) return;
          }
          let offline = D.make('div', {
            innerText: ele.name,
            className: 'btn',
            onclick: function() {
              //this.remove()
              let server = JSON.parse(JSON.stringify(ele))
              server.dayTotal = 0
              server.dayTables = 0;
              server.lastSeated =(new Date).getTime()
              data.activeServers.push(server)
              renderServerList() //consider more efficient swaps
            }
          })
          inactive.append(offline)
        })
        data.activeServers.forEach((ele,i)=> {
          let inline = D.make('div', {
            innerText: ele.name,
            className: 'btn',
            onclick: function() {
              data.activeServers.splice(i,1)
              renderServerList()
            }
          })
          active.append(inline)
        })
      }
      renderServerList()
      modal.append(active, inactive, /*D.make('button', {
        innerText: 'Submit',
        onclick: function() {
          bg.remove()
        }
      })*/)
      bg.append(modal)

      D.find('body').append(bg)
    }
  })
  let openHelp = D.make('button', {
    innerText: 'Info/Guide',
    className: 'btn btnInfo',
    onclick: function() {
      let bg = D.make('div', {
        className: 'modalBG',
        onclick: function() {
          this.remove()
        }
      })
      let modal = D.make("div", {
        className: 'modal',
        style: 'background-color: #FAFAFA; text-shadow:none;',
        onclick: function(e) {
          e.stopPropagation()
        },
        innerHTML: `<p> To get started, click add table. Table's size and shape can be adjusted, and then change their X/Y position to get them where you want (can also click-drag them). For multi-level restaurants or those with patios, you can also add new floors.</p>
        <p>Clicking the create server button will add a server to the database. To make them active (when they're on shift), click the Change Active Servers button and move them to the left column. Once that's done and closed out, they'll show up in the top right of the screen and you can click on them to assign them a section if desired</p>
        <p>To seat a table, simply click on the table and press the circular button by "seated". This will auto-assign it to the server whose section it is, if it has a section. Otherwise click the dropdown box on the right to assign it to an active server.</p>
        <p>Suggested next to seat is based on a combination of which server has gone the longest without being sat, which server has had the fewest guests for the day, and which server is the least busy and best able to take a new table.</p>`
      })
      bg.append(modal)

      D.find('body').append(bg)
    }
  })
  let openDB = D.make('button', {
    innerText: 'Database',
    onclick: function() {
      let bg = D.make('div', {
        className: 'modalBG',
        onclick: function() {
          this.remove()
        }
      })
      let modal = D.make("div", {
        className: 'modal',
        style: 'background-color:#FAFAFA;',
        onclick: function(e) {
          e.stopPropagation()
        },
      })
      modal.append(D.make('button', {
        innerText: 'Clear Database',
        title: 'deletes all saved data',
        style: 'margin: .7rem;',
        className: 'btnWarn',
        onclick: function() {
          events.reset()
        }
      }),
      D.make('a', {
        innerText: 'Save Backup of Database',
        className: 'btn',
        href: "data:text/txt,"+JSON.stringify(data, 0,2),
        download: "tableBackup.txt",
        /*onclick: function() {
          console.log('saving')
          function download(dataurl, filename) {
            var a = document.createElement("a");
            a.href = dataurl;
            a.setAttribute("download", filename);
            a.click();
            return false;
          }
          download("data:text/json,"+JSON.stringify(data, 0,2), "tableBackup.json");
        }*/
      }), D.make('hr')
      )
      modal.append(D.make('span', {
        innerHTML: `Load backup: <input id='fileUpload' type='file' value='Upload'>
          <input type = 'submit' id='submitUpload' class='btnSubmit' value='Submit'>`
      }))
      modal.querySelector('#submitUpload').onclick = function() {
        var input = modal.querySelector("#fileUpload");
        var reader = new FileReader();
        if (input.files.length) {
          var textFile = input.files[0];
          reader.onload = function (e) {
            try {
              data = JSON.parse(e.target.result)
            } catch(err) {
              console.log(err)
            }
            events.save()
            setTimeout(function() {
              location.reload()
            },250)
          };
          reader.readAsText(textFile);
        } else {
        }
      }
      bg.append(modal)

      D.find('body').append(bg)
    }
  })
  let openSettings = D.make('button', {
    innerText: 'Open Settings',
    onclick: function() {
      let bg = D.make('div', {
        className: 'modalBG',
        onclick: function() {
          this.remove()
        }
      })
      let modal = D.make("div", {
        className: 'modal',
        style: 'background-color:white;',
        onclick: function(e) {
          e.stopPropagation()
        },
        innerHTML: `Choose color theme: <select id='selectTheme'>
        <option value ='normal'>Default</option>
        <option value='dark'>Dark</option>
        <option value='shadow'>Shadow</option>
        <option value='light'>Light</option>
        </select><button id='submitTheme'>Submit</button>
        `
      })
      if (data.settings.theme) {
        modal.querySelector('#selectTheme').value = data.settings.theme
      }
      modal.querySelector('#submitTheme').onclick = function() {
        data.settings.theme = D.find('#selectTheme').value
        events.save()
        setTimeout(function() {
          location.reload()
        },500)

      }
      bg.append(modal)

      D.find('body').append(bg)
    }
  })
  right.append(stats, openEdit, edit)
  edit.append(createTable, createServer, deleteServer, adjustActive, openHelp, createFloor, deleteFloor, openDB, createObject, openSettings)
  setTimeout(function() {
    events.renderStats()
  },20000)
}
{//left
  let left = D.find('#left')
  let floorRefs = []
  events.objectActions = function(obj, ref) {
    let bg = D.make('div', {
      className: 'modalBG',
      onclick: function() {
        this.remove()
        events.renderStats()
      }
    })
    let modal = D.make("div", {
      className: 'modal',
      style: 'display:flex;',
      onclick: function(e) {
        e.stopPropagation()
      }
    })
    bg.append(modal)
    let dimensions = D.make('div', {
      className: ''
    })
    dimensions.append(
      D.make('label', {innerHTML: 'Type: '}),
      D.make('select', {
        innerHTML: `<option value='plant1'>plant</option><option value='doors1'>door</option><option value='aquarium'>aquarium</option><option value='umbrella'>umbrella</option>`,
        value: obj.type,
        oninput: function() {
          obj.type = this.value;
          events.renderObject(obj, obj.i)
        }
      }),
      D.make('br'),
      D.make('label', {innerHTML: 'Length:'}),
      D.make('input', {
        value: obj.loc[2],
        type: 'number',
        oninput: function() {
          obj.loc[2] = +this.value;
          events.renderObject(obj, obj.i)
        }
      }),
      D.make('br'),
      D.make('label', {innerHTML: 'Height:'}),
      D.make('input', {
        value: obj.loc[3],
        type: 'number',
        oninput: function() {
          obj.loc[3] = +this.value;
          events.renderObject(obj, obj.i)
        }
      }),
      D.make('br'),
      D.make('label', {innerHTML: 'X:'}),
      D.make('input', {
        value: obj.loc[0],
        type: 'number',
        step: '2',
        oninput: function() {
          obj.loc[0] = +this.value;
          events.renderObject(obj, obj.i)
        }
      }),
      D.make('br'),
      D.make('label', {innerHTML: 'Y:', title: 'Measured from top down.'}),
      D.make('input', {
        value: obj.loc[1],
        type: 'number',
        step: '2',
        oninput: function() {
          obj.loc[1] = +this.value;
          events.renderObject(obj, obj.i)
        }
      }),
      D.make('br'),
      D.make('label', {innerHTML: 'Floor #:'}),
      D.make('input', {
        min: 1,
        max: data.floors.length,
        value: obj.floor +1,
        type: 'number',
        oninput: function() {
          obj.floor = +this.value-1;
          events.renderObject(obj, obj.i)
        }
      }),
      D.make('br'),
      /*D.make('label', {innerHTML: 'Shape: '}),
      D.make('select', {
        innerHTML: `<option value='square'>square</option><option value='round'>round</option>`,
        value: obj.loc[4],
        oninput: function() {
          obj.loc[4] = this.value;
          events.renderObject(obj, obj.i)
        }
      }),
      D.make('br'), D.make('br'),*/
      D.make('button', {
        innerText: 'Delete Object',
        className: 'btn btnWarn',
        onclick: function() {
          data.env.splice(obj.i, 1)
          events.renderFloors()
          bg.remove()
        }
      })
    )
    let leftTable = D.make('div')
    leftTable.append(status,dimensions)
    modal.append(leftTable)
    D.find('body').append(bg)
  }
  events.tableActions = function(table, ref) {
    let bg = D.make('div', {
      className: 'modalBG',
      onclick: function() {
        data.lastTableCreated = {
          floor: table.floor,
          seats: table.seats,
          loc: table.loc.slice(0),
          section: table.section,
        }
        if (table.status == 'seated') {
          if (table.seated != currentStatus.seated && table.server == currentStatus.server) {
            data.activeServers.forEach(server=> {
              if (server.name == table.server) {
                server.dayTotal += (table.seated - currentStatus.seated)
              }
            })
          } else if (table.server != currentStatus.server) {
            data.activeServers.forEach(server=> {
              if (server.name == table.server) {
                server.dayTotal += (table.seated)
                server.dayTables += 1
              } else if (server.name == currentStatus.server) {
                server.dayTotal -= currentStatus.seated
                server.dayTables -= 1
              }
            })
          }
        }
        events.renderTable(table, table.i)
        events.renderStats()
        this.remove()
      }
    })
    let modal = D.make("div", {
      className: 'modal',
      style: 'display:flex;',
      onclick: function(e) {
        e.stopPropagation()
      }
    })
    bg.append(modal)
    let status = D.make('div', {
      style: 'margin-right: 1rem;'
    })
    let statusOpts = ['open', 'dirty', 'seated', 'reserved']
    let currentStatus = {
      server: table.server,
      seated: table.seated
    }
    statusOpts.forEach(ele => {
      let btn = D.make('input', {
        type: 'radio',
        name: 'tableStatusOpts',
        style: 'margin-top:.25rem;',
        value: ele,
        oninput: function() {
          table.status = ele
          //ref.className = `table ${table.loc[4]} ${table.status}`
          events.renderTable(table, table.i)
          if (table.status == 'seated') {
            data.activeServers.forEach(ele => {
              if (ele.section == table.section)
              table.server = ele.name
            })
            table.seated = table.seats
            table.timeSeated = (new Date).getTime()
            //tableServer.style.display = 'block'
          } else {
            table.timeSeated = false;
            table.server = false;
            table.seated = 0
          }
          makeRightTable()
        }
      })
      if (table.status == ele) btn.checked = true;
      let label = D.make('label', {
        innerText: ele
      })
      status.append(label, btn, D.make('br'))
    })
    let edit = D.make('button', {
      innerText: 'Edit Attributes',
      id: 'editDimensions',
      onclick: function() {
        dimensions.classList.toggle('hidden')
      }
    })
    status.append(edit)
    let dimensions = D.make('div', {
      className: 'hidden'
    })
    dimensions.append(
      D.make('br'),
      D.make('label', {innerHTML: 'Table Number:'}),
      D.make('input', {
        value: table.name,
        type: 'number',
        oninput: function() {
          table.name = +this.value;
          events.renderTable(table, table.i)
        }
      }),
      D.make('br'),
      D.make('label', {innerHTML: 'Length:'}),
      D.make('input', {
        value: table.loc[2],
        type: 'number',
        oninput: function() {
          table.loc[2] = +this.value;
          events.renderTable(table, table.i)
        }
      }),
      D.make('br'),
      D.make('label', {innerHTML: 'Height:'}),
      D.make('input', {
        value: table.loc[3],
        type: 'number',
        oninput: function() {
          table.loc[3] = +this.value;
          events.renderTable(table, table.i)
        }
      }),
      D.make('br'),
      D.make('label', {innerHTML: 'X:'}),
      D.make('input', {
        value: table.loc[0],
        type: 'number',
        step: '2',
        oninput: function() {
          table.loc[0] = +this.value;
          events.renderTable(table, table.i)
        }
      }),
      D.make('br'),
      D.make('label', {innerHTML: 'Y:', title: 'Measured from top down.'}),
      D.make('input', {
        value: table.loc[1],
        type: 'number',
        step: '2',
        oninput: function() {
          table.loc[1] = +this.value;
          events.renderTable(table, table.i)
        }
      }),
      D.make('br'),
      D.make('label', {innerHTML: 'Floor #:'}),
      D.make('input', {
        value: table.floor +1,
        min: 1,
        type: 'number',
        max: data.floors.length,
        oninput: function() {
          table.floor = +this.value-1;
          events.renderTable(table, table.i)
        }
      }),
      D.make('br'),
      D.make('label', {innerHTML: 'Seats:'}),
      D.make('input', {
        value: table.seats,
        type: 'number',
        min: 0,
        onchange: function() {
          table.seats = +this.value;
          events.renderTable(table, table.i)
        }
      }),
      D.make('br'),
      D.make('label', {innerHTML: 'Shape: '}),
      D.make('select', {
        innerHTML: `<option value='square'>square</option><option value='round'>round</option>`,
        value: table.loc[4],
        oninput: function() {
          table.loc[4] = this.value;
          events.renderTable(table, table.i)
        }
      }),
      D.make('br'), D.make('br'),
      D.make('button', {
        innerText: 'Delete Table',
        className: 'btn btnWarn',
        onclick: function() {
          data.tables.splice(table.i, 1)
          events.renderFloors()
          bg.remove()
        }
      })
    )

    let rightTable = D.make('div')
    let makeRightTable = function() {
      rightTable.innerHTML = ''
      let section = D.make('div')
      section.append(D.make('label', {
        innerHTML: 'Section: '
      }))
      section.append(D.make("input", {
        type: 'number',
        min: 0,
        value: table.section || 0,
        oninput: function() {
          table.section = +this.value
          events.renderTable(table, table.i)
          makeRightTable()
        }
      })
      )
      data.activeServers.forEach(ele => {
        if (ele.section == table.section)
        section.append(D.make("span", {
          innerText: ` (${ele.name}'s section)`
        }))
      })

      let tableServer = D.make("div", {
        innerHTML: 'Server: '
      })
      let selectServer = D.make("select", {
        onchange: function() {
          table.server = (this.value)
          /*data.activeServers.forEach(ele=> {
            if (ele.name == table.server) {
              if (table.timeSeated> (ele.lastSeated || 0))
              ele.lastSeated = table.timeSeated
            }
          })*/
        }
      })
      tableServer.append(selectServer)
      selectServer.append(D.make('option', {
        value: 'false',
        innerText: 'unattended'
      }))
      data.activeServers.forEach(ele => {
        selectServer.append(D.make('option', {
          value: ele.name,
          innerText: ele.name
        }))
      })
      if (table.server) {
        selectServer.value = table.server
      }
      let seatedGuests = D.make('div', {
        innerHTML: '# of guests: '
      })
      let guestNumber = D.make('input', {
        type: "number",
        min: 0,
        value: table.seated,
        onchange: function() {
          table.seated = +this.value
        }
      })
      seatedGuests.append(guestNumber)
      rightTable.append(section, tableServer, seatedGuests)
      if (table.status != 'seated') tableServer.style.display = 'none'
    }
    makeRightTable()
    let leftTable = D.make('div')
    leftTable.append(status,dimensions)
    modal.append(leftTable,rightTable)
    D.find('body').append(bg)
  }
  events.renderFloors = function() {
    left.innerHTML = ''
    floorRefs = []
    data.floors.forEach((ele,i) => {
      let floor = D.make('div', {
        id: 'floor_' + i,
        className: 'floor',
        style: 'text-align:center;',
        ondrop: function(e) {
          if (window.dragging == 'table') {
            dragTable.table.loc[0] += Math.round((e.pageX - dragTable.x)/this.clientWidth*100)
            dragTable.table.loc[1] += Math.round((e.pageY - dragTable.y)/this.clientHeight*100)
            events.renderTable(dragTable.table)
            events.save()
          } else if (window.dragging == 'object') {
            dragObject.object.loc[0] += Math.round((e.pageX - dragObject.x)/this.clientWidth*100)
            dragObject.object.loc[1] += Math.round((e.pageY - dragObject.y)/this.clientHeight*100)
            events.renderObject(dragObject.object)
            events.save()
          }
        },
        ondragover: function(e) {
          e.preventDefault()
        },
      })
      floorRefs.push(floor)
      floor.append(D.make('div', {
        className: 'floorTitle',
        innerText: ele,
        contentEditable: true,
        style: 'display:inline-block;',
        onblur: function() {
          data.floors[i] = this.innerText
        }
      }))
      left.append(floor)
    })
    events.renderObject = function(ele, i) {
      if (i === undefined) {
        if (ele.i !== undefined) {
          i = ele.i
        } else {
          i = data.tables.length-1
        }
      }
      if (D.find('#object_'+i)) D.find('#object_'+i).remove()
      ele.i = i
      let object = D.make('div', {
        id: 'object_' + i,
        draggable: true,
        className: `object ${ele.type} ${ele.loc[4]}`,
        style: `left: ${ele.loc[0]}%; top: ${ele.loc[1]}%; width: ${ele.loc[2]}%; height: ${ele.loc[3]}%;`,
        onclick: function() {
          events.objectActions(ele, object)
        },
        ondragstart: function(e) {
          e.dataTransfer.setData("text/html", "");
          window.dragObject = {object: ele, ref: object, x: e.pageX, y: e.pageY}
          window.dragging = 'object'
        },
      })
      floorRefs[ele.floor].append(object)
      return object
    }
    //@events.renderTable
    events.renderTable = function(ele, i) {
      if (i === undefined) {
        if (ele.i !== undefined) {
          i = ele.i
        } else {
          i = data.tables.length-1
        }
      }
      if (D.find('#table_'+i)) D.find('#table_'+i).remove()
      ele.i = i

      let table = D.make('div', {
        id: 'table_' + i,
        draggable: true,
        className: `table ${ele.loc[4]} ${ele.status} section${ele.section}`,
        style: `left: ${ele.loc[0]}%; top: ${ele.loc[1]}%; width: ${ele.loc[2]}%; height: ${ele.loc[3]}%;`,
        title: `seats: ${ele.seats}\nsection: ${ele.section || 'none'}\n
        `,
        onclick: function() {
          events.tableActions(ele, table)
        },
        ondragstart: function(e) {
          e.dataTransfer.setData("text/html", "");
          window.dragTable = {table: ele, ref: table, x: e.pageX, y: e.pageY}
          window.dragging = 'table'
        },
      })
      if (ele.status == 'seated' || ele.status == 'dirty') {
        table.title += `seated ${(((new Date).getTime() - ele.timeSeated)/60000).toFixed(1)} minutes ago`
      }
      let tableTitle = D.make('div', {
        innerText: ele.name,
        className: 'tableTitle',
        style: 'font-weight:700; text-shadow:0 0 .15rem white;font-size:1.1rem;'
      })
      table.append(tableTitle)
      let displaySeats = D.make('div', {
        className: 'displaySeats',
        innerText: `${ele.seated||0}/${ele.seats}`,
        style: ''
      })
      if (ele.loc[4] == 'round') {
        displaySeats.style.left = '85%'
        displaySeats.style.top = '85%'
      }
      table.append(displaySeats)
      floorRefs[ele.floor].append(table)
      return table
    }
    data.tables.forEach((ele,i) => {
      events.renderTable(ele,i)
    })
    data.env.forEach((ele,i) => {
      events.renderObject(ele,i)
    })
  }

}
