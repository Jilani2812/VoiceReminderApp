import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import AntDesign from 'react-native-vector-icons/AntDesign';
import SearchHeader from './SearchHeader.js';
import LogoImage from '../../image/vnrwhite.png'
import { PLATFORM_IOS, SCREEN_WIDTH, isIPhoneX, scale } from '../Screens/Scale.js';

const Header = ({ shadow, title, goBack, navigation, search, titleHeader, rightArrow }) => {
    return (
        <SafeAreaView
            style={{ backgroundColor: '#FF5C00', paddingTop: PLATFORM_IOS ? (isIPhoneX ? 3 : 10) : scale(40) }}>

            {goBack &&
                <View style={[styles.container, shadow && styles.shadow, { paddingBottom: scale(15), paddingTop: scale(7) }]}>
                    <View style={{ paddingHorizontal: scale(15), flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}
                            onPress={() => {
                                if (rightArrow) {
                                }
                                else {
                                    navigation.goBack();
                                }
                            }}>
                            {rightArrow ?
                                <View style={{ marginRight: scale(10), alignSelf: 'center' }}>
                                    <Image source={require('../../image/vnrwhite.png')}
                                        style={{ width: scale(30), height: scale(40), resizeMode: 'contain' }} />

                                </View>
                                :
                                <View style={{ marginRight: scale(10), alignSelf: 'center' }}>
                                    <AntDesign
                                        name="arrowleft"
                                        size={25}
                                        color={'#FFFFFF'}
                                    />
                                </View>
                            }
                        </TouchableOpacity>

                        {titleHeader &&
                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text numberOfLines={1} style={{ ...styles.title, color: '#FFFFFF', fontSize: scale(20), textAlign: 'left' }}>{titleHeader}</Text>
                                <TouchableOpacity
                                    onPress={() => { }}
                                    style={{ marginRight: scale(15) }}>
                                    {/* <Image
                                        source={require("../../image/search.png")} // Add your search icon here
                                        style={{width:scale(20), height:scale(20), resizeMode:'contain'}}
                                    /> */}
                                </TouchableOpacity>
                            </View>
                        }

                    </View>
                </View>
            }

            {
                search &&
                <View style={[styles.container, shadow && styles.shadow, { paddingBottom: scale(2) }]}>
                    <SearchHeader
                        isFocused={false}
                        containerStyle={{  flex: 1, borderRadius: scale(20), marginBottom: scale(8) }}
                        placeholder={`Search Reminder`}
                    />
                </View>
            }

            {
                title &&
                <View style={[styles.container, shadow && styles.shadow, { paddingVertical: scale(5) }]}>
                    <Text style={{ ...styles.title, flex: goBack ? 0.88 : 1, fontSize: scale(16) }}>{title}</Text>
                </View>
            }

        </SafeAreaView >
    )
}

export default Header

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: scale(25),
        borderBottomRightRadius: scale(25)
    },
    text: {
        fontSize: 13,
        fontWeight: '400',
        textAlign: 'center',
        letterSpacing: 0.17,
    },

    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 26,
        fontWeight: '600',
    },
    cartNum: {
        position: 'absolute',
        top: -scale(12),
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5096C',
        borderRadius: 18,
        width: scale(20),
        height: scale(20)
    },
    shadow: {
        // borderBottomWidth: 2,
        // borderColor: 'rgba(0, 0, 0, 0.1)',
        shadowColor: '#000',
        // backgroundColor: colors.APP_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4
    },
    cart: {
        position: 'absolute',
        right: 15,
        flexDirection: 'row',
        alignItems: 'center'
    },
    dropDownBtnView: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 26,
        width: scale(115),
        borderRadius: 5
    },
    dropDownTxt: {
        textAlign: 'left',
        fontSize: scale(13),

        color: '#FFFFFF',
        // fontFamily: PRESTA_SANSHEAD_MEDIUM,
        paddingHorizontal: scale(5),
        flex: 0.92
    },

})