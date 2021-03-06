import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import DrumMachine from './components/DrumMachine';
import Pads from './components/Pads';
import Controls from './components/Controls';
import SignUpContainer from './components/SignUpContainer';
import SignInContainer from './components/SignInContainer';
import UserContainer from './components/UserContainer';
import SaveBtn from './components/SaveBtn';
import MIDISounds from 'midi-sounds-react';
import ReactDOM from 'react-dom';
import API from "./utils/API";

import Modal from 'react-responsive-modal';
import "./Login.css";


class App extends Component {
  constructor() {
    super();
    this.frequencies = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392];
    this.audioCx = new (window.AudioContext || window.webkitAudioContext)();
    this.gain = this.audioCx.createGain();
    this.gain.connect(this.audioCx.destination);
    this.gain.gain.value = 1;
    this.state = {
      pads: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      ],
      numPads: 4,
      playing: false,
      position: 0,
      bpm: 120,
      selectedDrum: [5, 25, 20, 35],
      volume: [0.5, 0.25, 0.75, 0.5],
      mute: false,
      open1: false,
      open2: false,
      users: [],
      currentUser: "",
      email: "",
      password: "",
      pads_users: [],
      usershow: false
    }
    this.togglePlaying = this.togglePlaying.bind(this);
    this.toggleActive = this.toggleActive.bind(this);
    this.changeBpm = this.changeBpm.bind(this);
    this.changeSampleVolume = this.changeSampleVolume.bind(this);
    this.onSelectDrum = this.onSelectDrum.bind(this);
    this.LoadUserPads = this.LoadUserPads.bind(this);
  }


  onOpenModal_SignUp = () => {
    this.loadUsers();
    console.log(this.state.users)
    this.setState({ open1: true });
  };

  onCloseModal_SignUp = () => {
    this.loadUsers();
    this.setState({ open1: false });
  };

  onOpenModal_SignIn = () => {
    this.loadUsers();
    this.setState({ open2: true });
  };

  onCloseModal_SignIn = () => {
    this.loadUsers();
    this.setState({ open2: false });
  };

  componentDidMount() {
    this.loadUsers();
    this.LoadUserPads();
    this.setState({ initialized: true });
  };

  loadUsers = () => {
    API.getUser()
      .then(res =>
        this.setState({ users: res.data })
      )
      .catch(err => console.log(err));
  };

  LoadUserPads = () => {
    API.getPads()
      .then(res =>
        this.setState({ pads_users: res.data })
      )
      .catch(err => console.log(err));
  };

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
    console.log("Email: ", this.state.email, "Password: ", this.state.password);
    console.log(this.state.users);
  };

  validateForm = () => {
    return this.state.email.length > 0 && this.state.password.length > 0;
  };


  toggleActive(rowIndex, id) {
    console.log('Pad', rowIndex, id);
    let pads = [...this.state.pads];
    let padState = pads[rowIndex][id];

    if (padState === 1) {
      pads[rowIndex][id] = 0;
    } else {
      pads[rowIndex][id] = 1;
    }

    this.setState({ pads: pads });
  }

  togglePlaying() {
    if (this.state.playing) {
      clearInterval(this.timerId);
      this.setState({ playing: false });
    } else {
      this.setTimer();
      this.setState({ playing: true });
    }
  }

  setTimer() {
    this.timerId = setInterval(() => this.tick(), this.calculateTempo(this.state.bpm));
  }

  calculateTempo(bpm) {
    return 15000 / bpm;
  }

  tick() {
    let pos = this.state.position;
    pos++;
    if (pos > 15) {
      pos = 0;
    }
    this.setState({ position: pos });
    this.checkPad();
  }

  checkPad() {
    this.state.pads.forEach((row, rowIndex) => {
      row.forEach((pad, index) => {
        if (index === this.state.position && pad === 1) {
          console.log("active");
          this.playSound(rowIndex);
        };
      })
    });
  }

  playSound(rowIndex) {
    // let freq = this.frequencies[rowIndex];
    // let node = this.audioCx.createOscillator();
    // let currentTime = this.audioCx.currentTime;
    // node.frequency.value = freq;
    // node.detune.value = 0;
    // node.type = 'sine';
    // node.connect(this.gain);
    // node.start(currentTime);
    // node.stop(currentTime + 0.2);
    console.log("play");
    let sample = this.state.selectedDrum[rowIndex];
    this.midiSounds.playDrumsNow([sample]);
    // if (rowIndex === 0) {
    //   console.log("Row: 0 play");
    //   this.midiSounds.playDrumsNow([35]);
    // }
    // if (rowIndex === 1) {
    //   console.log("Row: 1 play");
    //   this.midiSounds.playDrumsNow([15]);
    // }
    // if (rowIndex === 2) {
    //   console.log("Row: 2 play");
    //   this.midiSounds.playDrumsNow([24]);
    // }
    // if (rowIndex === 3) {
    //   console.log("Row: 3 play");
    //   this.midiSounds.playDrumsNow([5]);
    // }
  }

  changeBpm(bpm) {
    this.setState({ bpm: bpm.target.value });
    if (this.state.playing) {
      clearInterval(this.timerId);
      this.setTimer();
    }
  }

  changeSampleVolume(e, rowIndex) {
    console.log("event: ", e, "row: ", rowIndex);
    let rackVol = [...this.state.volume];


    rackVol.splice(rowIndex, 1, e.target.value);
    let sampleVol = rackVol[rowIndex];
    this.setState({ volume: rackVol });

    console.log("rackVol: ", rackVol);
    console.log("sampleVol: ", sampleVol);
    this.sendVolumes(rowIndex, sampleVol);

    if (this.state.playing) {
      clearInterval(this.timerId);
      this.setTimer();
    }
  }

  sendVolumes(rowIndex, volume) {
    console.log("In change volume state. The selected Drums: ", this.state.selectedDrum[rowIndex], "The Volume: ", this.state.volume[rowIndex])
    this.midiSounds.setDrumVolume(this.state.selectedDrum[rowIndex], volume);
  }

  onSelectDrum(e, rowIndex) {
    var list = e.target;
    let n = list.options[list.selectedIndex].getAttribute("value");
    let drumSelect = [...this.state.selectedDrum];

    let rowDrum = drumSelect[rowIndex];

    drumSelect.splice(rowIndex, 1, n);
    console.log("ROW Drum: ", rowDrum, "Index: ", rowIndex);

    this.setState({ selectedDrum: drumSelect });

    console.log("Selected Drums: ", drumSelect);
    this.midiSounds.cacheDrum(n);
  }
  createSelectItems() {
    if (this.midiSounds) {
      if (!(this.items)) {
        this.items = [];
        for (let i = 0; i < this.midiSounds.player.loader.drumKeys().length; i++) {
          this.items.push(<option key={i} value={i}>{'' + (i + 0) + '. ' + this.midiSounds.player.loader.drumInfo(i).title}</option>);
        }
      }
      return this.items;
    }
  }

  addNewPads = () => {
    var newArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    console.log("state", this.state);
    var newVol = 0.5
    var newDrum = 21
    this.setState({ pads: [...this.state.pads, newArray] });
    this.state.volume.push(newVol);
    this.state.selectedDrum.push(newDrum);
    this.state.numPads++;
    console.log(this.state.numPads);
  }

  clearRow = (rowIndex) => {
    console.log('Pad row:', rowIndex);
    let pads = [...this.state.pads];
    let padState = pads[rowIndex];
    console.log("padState: ", padState);
    for (var i = 0; i < padState.length; i++) {
      if (padState[i] === 1) {
        pads[rowIndex][i] = 0;
      }
    }
    console.log("pushed pads: ", pads);
    this.setState({ pads: pads });

  }

  deleteRow = (rowIndex) => {
    let pads = [...this.state.pads];
    let volume = [...this.state.volume];
    let drums = [...this.state.selectedDrum];

    pads.splice(rowIndex, 1);
    volume.splice(rowIndex, 1);
    drums.splice(rowIndex, 1);
    console.log("pushed pads: ", pads);
    this.setState({ pads: pads });
    this.setState({ volume: volume });
    this.setState({ selectedDrum: drums });
    this.state.numPads--;
    console.log(this.state.numPads);
  }

  clickPadButtons = (Array) => {
    let newPads = Array;

    this.setState({ pads: newPads });
  }

  toggleUsernameShow = () => {
    const {usershow} = this.state
    this.setState({usershow: !usershow})
  }

  logOffonClick = () => {
    this.toggleUsernameShow();
    this.setState({email: ""});
  }

  render() {
    const { open1 } = this.state;
    const { open2 } = this.state;
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">The React Drum Sequencer</h1>
        </header>
        {this.state.usershow && <UserLogged email={this.state.email} />}
        {!this.state.usershow && <button className="login_modal_button" onClick={this.onOpenModal_SignUp}>Sign Up</button>}
        {!this.state.usershow && <button className="login_modal_button" onClick={this.onOpenModal_SignIn}>Sign In</button>}
        {this.state.usershow && <button className="login_modal_button" onClick={this.logOffonClick}>Log off</button>}
        <Modal open={open1} onClose={this.onCloseModal_SignUp} little>
          <h2>Sign Up</h2>
          <p>Save your sequence</p>
          <SignUpContainer onClose={this.onCloseModal_SignUp} LoadUsers={this.LoadUsers} users={this.state.users} />
        </Modal>
        <Modal open={open2} onClose={this.onCloseModal_SignIn} little>
          <h2>Sign In</h2>
          <p>Save your sequence</p>
          <SignInContainer email={this.state.email} handleChange={this.handleChange} validateForm={this.validateForm} users={this.state.users} onClose={this.onCloseModal_SignIn} password={this.state.password} LoadUsers={this.LoadUsers} toggleUsernameShow={this.toggleUsernameShow}/>
        </Modal>
        <Pads
          pos={this.state.position}
          pads={this.state.pads}
          toggleActive={this.toggleActive}
          clearRow={this.clearRow}
          deleteRow={this.deleteRow}
          selectedDrum={this.state.selectedDrum}
          createdDrums={this.createSelectItems()}
          onSelectDrum={this.onSelectDrum}
          sampleVolume={this.state.volume}
          changeVolume={this.changeSampleVolume} />
        <Controls
          bpm={this.state.bpm}
          handleChange={this.changeBpm}
          playing={this.state.playing}
          togglePlaying={this.togglePlaying}
          addNewPads={this.addNewPads} />
        <SaveBtn users={this.state.users} pads={this.state.pads} email={this.state.email} pads_users={this.state.pads_users} LoadUserPads={this.LoadUserPads()} clickPadButtons={this.clickPadButtons} />
        <MIDISounds
          ref={(ref) => (this.midiSounds = ref)}
          appElementName="root"
          instruments={[111]}
          drums={[2, 33, 15, 5, 35, 24]} />
      </div>
    );
  }
}

class UserLogged extends Component{
  constructor(props) {
    super(props);
  }
  render(){
    return(
      <div>
        <UserContainer email={this.props.email}></UserContainer>
      </div>
    )
  }
}

export default App;
