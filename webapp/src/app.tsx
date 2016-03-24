declare function require(string): string;
import $ = require("jquery");
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as VoxImplant from 'voximplant-websdk';
require('./app.scss');

enum AppViews {
	INIT,
	CONNECTING,
	CONNFAILED,
	CONNCLOSED,
	AUTH,
	CALLING,
	CALLCONNECTED,
	CALLFAILED,
	CALLDISCONNECTED
}

class App extends React.Component<any, any> {

	voxAPI: VoxImplant.Client;
	currentCall: VoxImplant.Call;
	participants: number;
	micMuted: boolean = false;

	constructor() {
		super();
		this.state = {
			view: AppViews.INIT
		};
		this.voxAPI = VoxImplant.getInstance();
		this.voxAPI.addEventListener(VoxImplant.Events.SDKReady, (e: VoxImplant.Events.SDKReady) => this.onSDKReady(e));
		this.voxAPI.addEventListener(VoxImplant.Events.ConnectionEstablished, (e: VoxImplant.Events.ConnectionEstablished) => this.onConnectionEstablished());
		this.voxAPI.addEventListener(VoxImplant.Events.ConnectionFailed, (e: VoxImplant.Events.ConnectionFailed) => this.onConnectionFailed(e));
		this.voxAPI.addEventListener(VoxImplant.Events.ConnectionClosed, (e: VoxImplant.Events.ConnectionClosed) => this.onConnectionClosed());

		this.voxAPI.addEventListener(VoxImplant.Events.AuthResult, (e: VoxImplant.Events.AuthResult) => this.onAuthResult(e));

		this.voxAPI.init({
			micRequired: true
		});
	}

	onSDKReady(e: VoxImplant.Events.SDKReady) {
		this.setState({
			view: AppViews.CONNECTING
		});
		this.voxAPI.connect();
	}

	onConnectionEstablished() {
		this.setState({
			view: AppViews.AUTH
		});
		// PUT YOUR APPLICATION USERNAME / PASSWORD HERE
		this.voxAPI.login("USERNAME", "PASSWORD");
	}	

	onConnectionFailed(e: VoxImplant.Events.ConnectionFailed) {
		this.setState({
			view: AppViews.CONNFAILED
		});
	}

	onConnectionClosed() {
		this.setState({
			view: AppViews.CONNCLOSED
		});
	}

	onAuthResult(e: VoxImplant.Events.AuthResult) {
		if (e.result) {
			this.setState({
				view: AppViews.CALLING
			});
			this.currentCall = this.voxAPI.call("conf");
			this.currentCall.addEventListener(VoxImplant.CallEvents.Connected, (e: VoxImplant.CallEvents.Connected) => this.onCallConnected(e));
			this.currentCall.addEventListener(VoxImplant.CallEvents.Failed, (e: VoxImplant.CallEvents.Failed) => this.onCallFailed(e));
			this.currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, (e: VoxImplant.CallEvents.Disconnected) => this.onCallDisconnected(e));
			this.currentCall.addEventListener(VoxImplant.CallEvents.MessageReceived, (e: VoxImplant.CallEvents.MessageReceived) => this.onMessageReceived(e));
		}
	}

	onCallConnected(e: VoxImplant.CallEvents.Connected) {
		this.setState({
			view: AppViews.CALLCONNECTED
		});
	}

	onCallFailed(e: VoxImplant.CallEvents.Failed) {
		this.setState({
			view: AppViews.CALLFAILED
		});
	}

	onCallDisconnected(e: VoxImplant.CallEvents.Disconnected) {
		this.setState({
			view: AppViews.CALLDISCONNECTED
		});
	}

	onMessageReceived(e: VoxImplant.CallEvents.MessageReceived) {
		try {
			let data: Object = JSON.parse(e.text);
			if (typeof data["participants"] != "undefined") this.participants = data["participants"];
			this.forceUpdate();
		} catch (e) {
			console.log(e);
		}
	}

	disconnect() {
		this.currentCall.hangup();
	}

	micMute() {
		if (this.micMuted === true) {
			this.currentCall.unmuteMicrophone();
			this.micMuted = false;
		} else {
			this.currentCall.muteMicrophone();
			this.micMuted = true;
		}
		this.forceUpdate();
	}

	render() {

		let label: string = "Intializing...",
			loader: string = "loader",
			muteButton: JSX.Element;
		if (this.state.view == AppViews.CONNECTING) label = "Establishing connection...";
		if (this.state.view == AppViews.AUTH) label = "Authorizing...";
		if (this.state.view == AppViews.CALLING) label = "Joining the conference...";
		if (this.state.view == AppViews.CALLCONNECTED) {
			label = "Connected to the conference" + (this.participants!=0?": "+this.participants:"");
			loader = "loader stopped";
			muteButton = <button onClick={() => this.micMute() } className="mute">{this.micMuted ? "Unmute mic" : "Mute mic"}</button>;
		}
		if (this.state.view == AppViews.CALLFAILED) {
			label = "Couldn't join the conference...";
			loader = "loader stopped";			
		}
		if (this.state.view == AppViews.CALLDISCONNECTED) {
			label = "Disconnected";
			loader = "loader stopped";
		}

		if (this.state.view == AppViews.CONNFAILED) {
			return <div>Connection failed. Please check your network settings.</div>;
		}
		if (this.state.view == AppViews.CONNCLOSED) {
			return <div>Connection closed.</div>;
		}

		return <div className="col">
				<div className={loader}></div>
				<div className="label">{label}</div>
				{this.state.view == AppViews.CALLCONNECTED?<div>{muteButton}<button className="disconnect" onClick={() => this.disconnect()}>Disconnect</button></div>:""}
				</div>;

	}
}

export default App;

ReactDOM.render(<App />, document.getElementById('app'));