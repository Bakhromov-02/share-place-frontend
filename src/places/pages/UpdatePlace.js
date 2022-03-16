import React, {useEffect, useState, useContext} from "react";
import {useParams, useHistory} from "react-router-dom";

import './PlaceForm.css'
import Input from "../../shared/components/FormElements/Input";
import {VALIDATOR_REQUIRE, VALIDATOR_MINLENGTH} from "../../shared/util/validators";
import Button from "../../shared/components/FormElements/Button";
import {useForm} from "../../shared/hooks/form-hook";
import Card from "../../shared/components/UIElements/Card";
import {useHttpClient} from "../../shared/hooks/http-hook";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import {AuthContext} from "../../shared/context/auth-context";
import ImageUpload from "../../shared/components/FormElements/ImageUpload";

const UpdatePlace = () => {
    const {error, isLoading, sendRequest, clearError} = useHttpClient();
    const [loadedPlace, setLoadedPlace] = useState();
    const placeId = useParams().placeId;
    const history = useHistory();
    const auth = useContext(AuthContext);

    const [formState, inputHandler, setFormData] = useForm({
        title: {
            value: '',
            isValid: true
        },
        description: {
            value: '',
            isValid: true
        }
    }, true);

    useEffect(() => {
        const fetchPlace = async () => {
            try {
                const responseData = await sendRequest(`${process.env.REACT_APP_BACKEND_URL}/api/places/${placeId}`);
                setLoadedPlace(responseData.place);
                setFormData({
                    title: {
                        value: responseData?.place?.title,
                        isValid: true
                    },
                    description: {
                        value: responseData?.place?.description,
                        isValid: true
                    },
                    image: {
                        value: `${process.env.REACT_APP_BACKEND_URL}${responseData?.place?.image}`,
                        isValid: true
                    }
                }, true);
            } catch (e) {
                console.log(e.message)
            }
        };

        fetchPlace();
    }, [sendRequest, placeId])


    const placeUpdateSubmitHandler = async event => {
        event.preventDefault();
        try {
            if (typeof (formState.inputs.image.value) === 'string') {
                await sendRequest(
                    `${process.env.REACT_APP_BACKEND_URL}/api/places/${placeId}`,
                    'PATCH',
                    JSON.stringify({
                        title: formState.inputs.title.value,
                        description: formState.inputs.description.value
                    }),
                    {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${auth.token}`
                    }
                )
            } else {
                const formData = new FormData();
                formData.append('title', formState.inputs.title.value);
                formData.append('description', formState.inputs.description.value);
                formData.append('image', formState.inputs.image.value);
                await sendRequest(
                    `${process.env.REACT_APP_BACKEND_URL}/api/places/${placeId}`,
                    'PATCH',
                    formData,
                    {
                        'Authorization': `Bearer ${auth.token}`
                    }
                )
            }
            history.push('/' + auth.userId + '/places')
        } catch (e) {
            console.log(e.message);
        }
    }


    if (isLoading) {
        return <div className='center'>
            <LoadingSpinner/>
        </div>
    }

    if (!loadedPlace && !error) {
        return (
            <div className='center'>
                <Card>
                    <h2>Could not find place!</h2>
                </Card>
            </div>
        )
    }

    return (
        <>
            <ErrorModal error={error} onClear={clearError}/>
            {!isLoading && loadedPlace && <form className='place-form' onSubmit={placeUpdateSubmitHandler}>
                <ImageUpload id='image' center onInput={inputHandler} errorText='Please provide an image.'
                             image={loadedPlace.image}/>
                <Input
                    id='title'
                    element='input'
                    type='text'
                    label='Title'
                    validators={[VALIDATOR_REQUIRE(),]}
                    errorText='Please enter a valid title.'
                    onInput={inputHandler}
                    initialValue={loadedPlace.title}
                    initialIsValid={true}
                />
                <Input
                    id='description'
                    element='textarea'
                    label='Description'
                    validators={[VALIDATOR_REQUIRE(), VALIDATOR_MINLENGTH(5)]}
                    errorText='Please enter a valid description (at least 5 characters).'
                    onInput={inputHandler}
                    initialValue={loadedPlace.description}
                    initialIsValid={true}
                />
                <Button type='submit' disabled={!formState.isValid}>UPDATE PLACE</Button>
            </form>
            }
        </>
    )
}

export default UpdatePlace;