/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React,{useState,useEffect,useRef} from 'react';
import {
	StyleSheet,
	Text,
	View,
	TouchableOpacity,
	PermissionsAndroid,
	Platform,
	Modal,
	ActivityIndicator,
	NativeModules
	
} from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
const CMD_ENROLL=7 // enroll data to host
const CMD_CAPTURE=8 // capture data to host
const CMD_ENROLL_IN_MODULE=2//enroll data in module
const CMD_SEARCH_IN_MODULE=4//capture data in module
const CMD_CLEAR_IN_MODULE=6 //clear all finger in module
const CMD_GETSN=16
const {FPModule} = NativeModules
const delay=(time) =>{
    return new Promise((resolve) => setTimeout(resolve, time))
}
const creatCmd=(cmd_id,data,len)=>{
	let cmd = Buffer.alloc(9+len)
	cmd[0]=70
	cmd[1]=84
	cmd[2]=0
	cmd[3]=0
	cmd[4]=cmd_id
	cmd[5]=len&0xFF
	cmd[6]=(len>>8)&0xFF
	if(len>0){
		for(let i=0;i<len;i++){
			cmd[7+i]=data[i]
		}
	}
	let sum=0
	for(i=0;i<len+9;i++){
		sum+=cmd[i]
	}
	cmd[7+len]=sum&0xff
	cmd[8+len]=(sum>>8)&0xff
	return cmd

}

const requestBluetoothPermission = async () => {
	if(Platform.OS==='android')
	{
		const granted = await PermissionsAndroid.request(
				PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
				// PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
				// PermissionsAndroid.PERMISSIONS.BLUETOOTH,
				// PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION

			// {
			// 	title: 'Access fine location required for discovery',
			// 	message:
			// 	'In order to perform discovery, you must enable/allow ' +
			// 	'fine location access.',
			// 	buttonNeutral: 'Ask Me Later',
			// 	buttonNegative: 'Cancel',
			// 	buttonPositive: 'OK',
			// }
		);
		return granted===PermissionsAndroid.RESULTS.GRANTED
	}
	return false
	
};
const LoadingModal=({visible,mess})=>{
    return(
        <Modal visible={visible} transparent animationType='fade' hardwareAccelerated={true}>
            <View style={styles.modalBackGround}>
                <ActivityIndicator size='large' color="#0059A7" />
                {mess&&<Text style={styles.normal_text}>{mess}</Text>}
            </View>

        </Modal>
    )
}
const App = (props) => {
	
	const [message,setMessage]=useState([])
	// const [log,setLog]=useState("")
	const [bluetoothEn,setBluetoothEn]=useState(true)
	const [device,setDevice] = useState(null)
	const [connection,setConnection]=useState(false)
	const [isLoading,setIsLoading]=useState(false)
	const [refFinger,setRefFinger]=useState([])
	const disconnectSub=useRef(null)
	const readDataSub = useRef(null)
	const MAX_LOG=50
	// const readTimer = useRef(null)
	useEffect(()=>{
		const enabledSub = RNBluetoothClassic.onBluetoothEnabled((event)=>onStateChanged(event))
		const disabledSub = RNBluetoothClassic.onBluetoothDisabled((event)=>onStateChanged(event))

		checkBluetoothEnable()
		return()=>{
			console.log('delete effect app:',connection)
			enabledSub.remove()
			disabledSub.remove()
		}
	},[])
	useEffect(()=>{
		console.log('status connection:',connection)
		if(connection){
			disconnectSub.current= RNBluetoothClassic.onDeviceDisconnected(async()=>{
				try{
					console.log('event disconnected!')
					await device.disconnect()
					setConnection(false)


				}
				catch(err){
					console.log('error disconnect device,',err)
				}
				if(readDataSub.current!==null){
					readDataSub.current.remove()
					readDataSub.current=null
				
				}
				if(disconnectSub.current!==null){
					disconnectSub.current.remove()
					disconnectSub.current=null
				}
				// if(readTimer.current!==null){
				// 	clearInterval(readTimer.current)
				// 	readTimer.current=null
				// }
				
				
			})
			if(device){
				console.log('sub read event')
				readDataSub.current= device.onDataReceived((data)=>onReceivedData(data))
			}
			
		}
		return()=>{
			console.log('delete effect connection:',connection)
			if(readDataSub.current!==null){
				readDataSub.current.remove()
			
			}
			if(disconnectSub.current!==null){
				disconnectSub.current.remove()
			}
			// if(readTimer.current!==null){
			// 	clearInterval(readTimer.current)
			// }
		}


	},[connection])

	const checkBluetoothEnable=async()=>{
		try {
			let res =await FPModule.initMatch()
			console.log('res match init:',res)
			let enabled = await RNBluetoothClassic.isBluetoothEnabled();
			console.log(` Status bluetooth: ${enabled}`);
			setBluetoothEn(enabled)
			if(!enabled){
				alert('Please enable bluetooth!')
			}
		} catch (error) {
			console.log('Status Error: ', error);
			setBluetoothEn(false)
		}
	}


	const onStateChanged=(e)=>{
		console.log('bluetooth event:',e)
		setBluetoothEn(e.enabled)
		let newDevice = e.enabled?device:null
		setDevice(newDevice)
	}
	
	const onConnectDevice=async()=>{
		if(!bluetoothEn){
			return alert('Please enable bluetooth!')
		}
		if(!connection)
		{
			try{
				setIsLoading(true)
				let granted=await requestBluetoothPermission() 
				if(!granted){
					return alert('Please accept permission bluetooth!')
				}
				let newDevice=device
				if(!newDevice){
					let bonded = await RNBluetoothClassic.getBondedDevices()
					// console.log('list device found:',bonded)
					let index = bonded.findIndex(el=>el.name.includes('SHBT20')===true)
					if(index<0){
						return alert('Please pair bluetooth fingerprint device!')
					}
					setDevice(bonded[index])
					newDevice = bonded[index]
					console.log('found bluetooth device:',bonded[index].address,bonded[index].name)
				}
				
				let checkConnect = await newDevice.isConnected()
				if(!checkConnect){
					let res = await newDevice.connect({
						CONNECTOR_TYPE: "rfcomm",
  						DELIMITER: '',
						// READ_TIMEOUT:0
					})
					setConnection(res)
					setIsLoading(false)
					if(!res){
						
						return alert('Error connecting with device!')
					}
					console.log('connected with device')
					addNewMess("connected with device!")
					//clear all data in module when start app
					if(refFinger.length==0){
						await newDevice.write(creatCmd(CMD_CLEAR_IN_MODULE,[],0),'hex')
						addNewMess("clear all finger in module done!")
					}

					
				}
	
				
			}
			catch(err){
				console.log('error connect device:',err)
				setIsLoading(false)
				alert(err)
			}
		}
		else{
			try{
				await device.disconnect()
				console.log('disconnected device!')
				addNewMess("disconnected with device!")
				setConnection(false)
			}
			catch(err){
				console.log('error disconnect device:',err)
				setConnection(false)
				alert(err)
			}
			

		}
		
	}
	const addNewMess=(mess)=>{
		let newMess= message
		newMess.push(new Date().toLocaleString()+': '+mess+'\n')
		// if(newMess.length>MAX_LOG){
		// 	newMess.shift()
		// }
		setMessage([...newMess])
		// setLog(newMess.join(''))
	}

	const onEnroll=async()=>{
			
		try{
			if(!connection){
				return alert('Please link device!')
			}
			//enroll with custom id 
			let len = refFinger.length
			let cmd = creatCmd(CMD_ENROLL_IN_MODULE,[len&0xff,(len>>8)&0xff],2)
			let res=await device.write(cmd,'hex')
			console.log('result enroll finger:',res)
			addNewMess('enroll event, place finger twice!')
		}
		catch(err){
			console.log('error to enroll finger:',err)
		}

	}
	
	const onCapture=async()=>{
			
		try{
			if(!connection){
				return alert('Please link device!')
			}
			let cmd = creatCmd(CMD_SEARCH_IN_MODULE,[],0)
			let res=await device.write(cmd,'hex')
			console.log('result capture finger:',res)
			addNewMess('capture event, please place finger!')
		}
		catch(err){
			console.log('error to capture finger:',err)
		}

	}
	const onReceivedData=async(data)=>{
		// console.log('raw data:',data)
		let dt = Buffer.from(data.data,'utf8')
		console.log('received data from device:',dt.length)
		// console.log(dt)
		if(dt.length>8 && dt[0]==70 && dt[1]==84)
		{
			let cmdTotal = (dt[5]&0xFF)+(dt[6]<<8&0XFF00)+9
			if(dt.length<cmdTotal){
				// addNewMess('receiced data error!')
				return
			}
			//handle enroll data
			if(dt[4]===CMD_ENROLL){
				let size = (dt[5]&0xff)+(dt[6]<<8&0xFF00)-1
				if(dt[7]==1){
					let refData = dt.slice(8,size+8)
					let newRef = refFinger
					newRef.push(refData.toString('base64'))
					setRefFinger([...newRef])
					console.log('ref:',refData.toString('base64'))
					addNewMess('enroll success,len='+refData.length)
					
				}
				else{
					addNewMess('enroll new finger failed!')
				}
			}
			//handle capture data
			else if(dt[4]===CMD_CAPTURE){
				let size = (dt[5]&0xff)+(dt[6]<<8&0xFF00)-1
				if(dt[7]==1){
					let capData= Buffer.alloc(512)
					for(let i=0;i<size;i++){
						capData[i]=dt[i+8]
					}
					// let capData = dt.slice(8,size+8)
					// console.log('new ref len:',capData.length)
					addNewMess('capture success,len='+capData.length)
					try{
						let match=false
						let capBase =capData.toString('base64')
						for(let i=0;i<refFinger.length;i++){
							// let refBase = Buffer.from(refFinger[i],'base64')
							
							// console.log(refFinger[i])

							let matchCore = await FPModule.MatchTemplate(refFinger[i],capBase)
							console.log('match core:',matchCore)
							if(matchCore>80){
								addNewMess('match finger success,index='+i)
								match=true
								break
							}
						}
						if(!match){
							addNewMess('No finger matched')
						}

					}
					catch(err){
						addNewMess('error match finger!')
						console.log('error match finger:'+err.toString())
					}
					
					
				}
				else{
					addNewMess('capture finger failed!')
				}
			}

			//handle enroll in module data
			else if(dt[4]==CMD_ENROLL_IN_MODULE)
			{
				let id = dt[8]  + (dt[9] << 8 & 0xFF00);
				console.log('id new finger:',id)
				let newRef = refFinger
				newRef.push(id)
				setRefFinger([...newRef])
				addNewMess('enroll success,id finger='+id)

			}
			//handle enroll in module data
			else if(dt[4]==CMD_SEARCH_IN_MODULE)
			{
				let id = dt[8] + (dt[9] << 8 & 0xFF00);
				console.log('match id:',id)
				if(!refFinger.includes(id)){
					addNewMess('No finger matched')
					return
				}
				addNewMess('finger matched id='+id)
				
			}
		}
		// else{
		// 	let str = new Date().toLocaleString()+': receiced data error!'
		// 	addNewMess(str)

		// }
	}
	
	return (
		<View style={styles.container}>
			<View style={styles.topBar}>
				<Text style={[styles.normal_text,{fontSize:18,fontWeight:"bold"}]}>Demo App</Text>
				<TouchableOpacity onPress={onConnectDevice}>
					<Text style={styles.link_button_text}>{connection? "Unlink Device":"Link Device"}</Text>
				</TouchableOpacity>
			</View>
			<View style={styles.area_text}>
				<Text style={styles.log_text}>{message.join('')}</Text>
			</View>
			<View style={styles.button_container}>
				<TouchableOpacity style={styles.button}  onPress={onEnroll}>
					<Text style={styles.button_text}>Enroll finger</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.button} onPress={onCapture}>
					<Text style={styles.button_text}>Capture finger</Text>
				</TouchableOpacity>
			</View>
			<LoadingModal visible={isLoading}/>
		</View>
	);
};
const styles= StyleSheet.create({
	container:{
		flex:1,
		backgroundColor:"#FFF",
		alignItems:'center'
	},
	topBar:{
        flexDirection:'row',
        justifyContent:'space-between',
        padding:16,
        backgroundColor:"#0059A7",
        alignItems:'center',
        width:'100%'
        
    },
	normal_text:{
        color:"#FFF",
        fontSize:14,
    },
	log_text:{
        color:"#FFF",
        fontSize:11,
    },
	
    link_button_text:{
        color:'#ED2025',
        fontSize:14,
        fontWeight:'bold'
    },
	button_container:{
		flexDirection:"row",
		justifyContent:"space-between",
		width:"80%",
		position:'absolute',
        bottom:20,

	},
	button:{
		flexDirection:'row',
        height:48,
        backgroundColor:"#0059A7",
        justifyContent:'center',
        alignItems:'center',
        borderRadius:4,
        paddingHorizontal:8,
		width:"45%"
	},
	button_text:{
		color:"#FFF",
        fontSize:14,
		fontWeight:"bold"
	},
	area_text:{
		backgroundColor:'#000',
		flex:1,
		width:"100%",
		paddingTop:8,
		paddingLeft:4
	},
	modalBackGround:{
		flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
	}


})
export default App;
