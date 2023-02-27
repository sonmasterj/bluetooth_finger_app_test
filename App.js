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
	// PermissionsAndroid,
	// Platform,
	Modal,
	ActivityIndicator,
	NativeModules,
	DeviceEventEmitter
	
} from 'react-native';
const {BarcodeModule} = NativeModules
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
	
	// const [message,setMessage]=useState([])

	const [isLoading,setIsLoading]=useState(false)
	const MAX_LOG=30
	const message = useRef([])
	const [log,setLog] =useState([])
	useEffect(()=>{
		openBarcode()
		const scanSucces =DeviceEventEmitter.addListener('scan-success',(dt)=>{
			console.log('new barcode:',dt)
			if(dt.data!==""){
				addNewMess("result :"+dt.data)
			}
			
		})
		// const scanErr = DeviceEventEmitter.addListener('scan-err',(dt)=>{

		// 	addNewMess("Scanned failed!")
			
			
		// })
		return()=>{
			// console.log('delete effect app:',connection)
			scanSucces.remove()
			// scanErr.remove()
			closeBarcode()
		}
	},[])
	const openBarcode=async()=>{
		try{
			setIsLoading(true)
			await BarcodeModule.open()
			await BarcodeModule.setContinueMode(1,2000)
			addNewMess("init scanner successfully!")
			setIsLoading(false)
		}
		catch(err){
			setIsLoading(false)
			addNewMess("init scanner failed!")
			console.log("error open barcode:",err)
		}
	}
	const closeBarcode=async()=>{
		try{
			await BarcodeModule.close()
		}
		catch(err){
			console.log("error close barcode:",err)
		}
	}
	const addNewMess=(mess)=>{
		let newMess= message.current
		if(newMess.length>MAX_LOG)
		{
			newMess.shift()
		}
		newMess.push(new Date().toLocaleString()+': '+mess+'\n')
		message.current=newMess
		setLog([...newMess])
	}

	const onSingleScan=async()=>{
		try{
			// setIsLoading(true)
			addNewMess("Singer scanning barcode ....")
			await BarcodeModule.setContinueMode(0,0)
			let res = await BarcodeModule.start()
			if(!res){
				addNewMess("Scanned failed!")
			}
		}
		catch(err){
			addNewMess("Scanned failed!")
			console.log("error scan barcode:",err)
		}
	}
	const onMultiScan=async()=>{
		try{
			// setIsLoading(true)
			addNewMess("Mutil scanning barcode ....")
			await BarcodeModule.setContinueMode(1,1000)
			let res = await BarcodeModule.start()
			if(!res){
				addNewMess("Scanned failed!")
			}
		}
		catch(err){
			addNewMess("Scanned failed!")
			console.log("error scan barcode:",err)
		}
	}
	const onStop=async()=>{
		try{
			addNewMess("Stopping barcode ....")
			let res= await BarcodeModule.stop()
			if(!res){
				addNewMess("Stopped failed!")
				return
			} 
			addNewMess("Stopped barcode done!")
		}
		catch(err){
			addNewMess("Stopped barcode failed!")
			console.log("error stop barcode:",err)
		}
	}
	return (
		<View style={styles.container}>
			<View style={styles.topBar}>
				<Text style={[styles.normal_text,{fontSize:18,fontWeight:"bold"}]}>Demo Barcode</Text>
				{/* <TouchableOpacity onPress={onConnectDevice}>
					<Text style={styles.link_button_text}>{connection? "Unlink Device":"Link Device"}</Text>
				</TouchableOpacity> */}
			</View>
			<View style={styles.area_text}>
				<Text style={styles.log_text}>{log.join('')}</Text>
			</View>
			<View style={styles.button_container}>
				<TouchableOpacity style={styles.button}  onPress={onSingleScan}>
					<Text style={styles.button_text}>Singler Scan</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.button}  onPress={onMultiScan}>
					<Text style={styles.button_text}>Multi Scan</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.button} onPress={onStop}>
					<Text style={styles.button_text}>Stop</Text>
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
		width:"30%"
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
