from django.shortcuts import render_to_response, render, redirect
from django.http import HttpResponseRedirect, HttpResponse
from django.template import RequestContext, Template, Context, loader
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib.auth import login,authenticate,logout
#from mongoengine.django.auth import User
from mongoengine import *
from mongoengine.queryset import DoesNotExist
from django.core.context_processors import csrf
import mongoengine
from bson.objectid import ObjectId
import logging
from jqchat.models import *
import json
from django.contrib.auth.decorators import login_required
import time


logr = logging.getLogger(__name__)

def login_view(request):
    c={}
    c.update(csrf(request))
    return render_to_response('login.html',c)

def auth_view(request):
    try:
        user=User.objects.get(username=request.POST['username'])
        if user.check_password(request.POST['password']):
            user.backend='mongoengine.django.auth.MongoEngineBackend'
            login(request, user)
            request.session.set_expiry(60*60*1)
            return HttpResponseRedirect('/account/loggedin/')
        else:
            messages.add_message(request,messages.ERROR,u"incorrect login")
    except DoesNotExist:
        messages.add_message(request,messages.ERROR,u"does not exist")
    return HttpResponseRedirect('/account/invalid/')

def loggedin(request):
    return HttpResponseRedirect('/users/')
    return render_to_response('home.html')

def invalid_login(request):
    return render_to_response('invalid_login.html')

def logout_view(request):
    logout(request)
    return HttpResponseRedirect('/')

def home(request):
    return render(request, 'index.html')

@login_required
def user_list(request):
    context = {}
    #users  = User.objects.filter(is_active=True, is_superuser = False, is_staff=False).exclude(username=request.user.username)
    users  = User.objects.filter(is_active=True, username__ne=request.user.username)
    print users
    context['users'] = users
    context['login_timestamp'] = time.time()
    return render(request, 'chat_room.html', context)

#this function only return one-to-one chat room if exist otherwise create a new room and return it.
def get_chat_room(request):
    friend  = request.GET.get('friend_id', None)
    create_room = False
    room = None
    if friend:
        friend = User.objects.get(id=friend)
        permutations = ( 
            (str(request.user.id)+':'+str(friend.id)),
            (str(friend.id)+':'+str(request.user.id))
        )
        for partner in permutations:
            try:
                room = Room.objects.get(participants=partner).id
                create_room = False
                break
            except Exception, e:
                create_room = True
                
    if create_room:
        room_name = str(request.user.username) + ':' + str(friend.username)
        room = Room.objects.create(participants=permutations[0], name=room_name).id
    context = {}
    context['room'] = room
    return HttpResponse(json.dumps(context), content_type='application/json')

def get_chat_list(request):
    context = {}
    friend_list = []
    login_timestamp = request.GET.get('login_timestamp', None)
    if login_timestamp:
        m_list = Message.objects.filter(unix_timestamp__gte=float(login_timestamp), event=None)
        print m_list, 'm_list'
        room_set = set()
        for m in m_list:
            room_set.add(Room.objects.get(name=m.room))
        room_set = list(room_set)
        active_friend_room = room_set

        for friend_room in active_friend_room:
            partners = friend_room.participants.split(':')
            partners.remove(str(request.user.id))
            if len(partners) > 1:
                return HttpResponse()
            temp = {}
            temp['url'] = "/chat/room/"+str(friend_room.id)+"/ajax/"
            temp['IntervalID'] = 0
            temp['room'] = friend_room.id
            temp['partners'] = partners[0]
            temp['partners_name'] = User.objects.get(id=ObjectId(partners[0])).username
            friend_list.append(temp)

        context['rooms'] = friend_list
        return HttpResponse(json.dumps(context), content_type='application/json')
    else:
        return HttpResponse()
        

def messages(request):
    context = {}
    room_array = []
    rooms = Room.objects.filter(participants__icontains=request.user.id)
    for room in rooms:
        temp = {}
        user_list = room.participants.split(':')
        user_list.remove(str(request.user.id))
        temp['is_group'] = 1 if (len(user_list)  > 1) else 0
        temp['partners'] = ','.join([str(x) for x in user_list])
        temp['users'] = User.objects.filter(id__in=user_list)
        temp['room'] = room
        room_array.append(temp)
    context['rooms'] = room_array
    return render(request, 'messages_window.html', context)

def check_user_list(request):
    users = request.GET.getlist('users[]', None)
    if request.user.username in users:
        users.remove(request.user.username)
    if users:
        exist_users = User.objects.filter(username__in=users, is_active=True)
        active_users = []
        inactive_users = users
        for exist_user in exist_users:
            active_users.append(exist_user.username)
            inactive_users.remove(exist_user.username)
        context = {}
        context['active_users'] = active_users
        context['users'] = users
        context['inactive_users'] = inactive_users
        return HttpResponse(json.dumps(context), content_type='application/json')
    else:
        return HttpResponse()

def create_group_chat(request):
    import itertools
    room_exist = False
    members = request.POST.getlist('members[]', None)
    permutation_list = members[:]
    permutation_list.append(request.user.username)
    permutation_list = list(itertools.permutations(permutation_list))
    for possible_room_name in permutation_list:
        possible_room_name = ':'.join(possible_room_name)
        try:
            exist_room = Room.objects.get(name=possible_room_name)
            room_exist = True
            break
        except:
            pass
    if room_exist:
        context = {}
        context['room'] = exist_room.id
        return HttpResponse(json.dumps(context), content_type='application/json')
    else:
        if request.user.username in members:
            members.remove(request.user.username)    
        if members:
            exist_users = User.objects.filter(username__in=members, is_active=True)
            room_name = request.user.username + ':' + ':'.join([x.username for x in exist_users])
            room = Room.objects.create(name=room_name)
            participants = str(request.user.id) + ':' + ':'.join([str(x.id) for x in exist_users])
            room.participants = participants
            room.save()
            context = {}
            context['room'] = room.id
            return HttpResponse(json.dumps(context), content_type='application/json')
        else:
            return HttpResponse()