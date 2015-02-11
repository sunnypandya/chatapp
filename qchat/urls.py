from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
#admin.autodiscover()

urlpatterns = patterns('',
    (r'^qchat/', include('regme.urls')),
    (r'^qchat/', include('friendship.urls')),
    url(r'^account/login/$', 'qchat.views.login_view'),
    url(r'^account/auth/$', 'qchat.views.auth_view'),
    url(r'^account/loggedin/$', 'qchat.views.loggedin'),
    url(r'^account/invalid/$', 'qchat.views.invalid_login'),
    url(r'^account/logout/$', 'qchat.views.logout_view'),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', 'qchat.views.home', name='home'),
    url(r'^getchatroom/', 'qchat.views.get_chat_room', name='get_chat_room'),
    url(r'^chat/', include('jqchat.urls')),
    url(r'^messages/', 'qchat.views.messages', name='messages'),
    url(r'^users/$','qchat.views.user_list', name='user_list'),
    url(r'^check_user_list/', 'qchat.views.check_user_list', name='check_user_list'),
    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
)
