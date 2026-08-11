package id.sinapp.fvms;

public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    @Override
    protected String getWebAppUrl() {
        return getString(R.string.webAppUrl);
    }

    @Override
    protected String getWebAppScope() {
        return getString(R.string.webAppScope);
    }

    @Override
    protected String getWebAppManifestId() {
        return getString(R.string.webAppManifestId);
    }
}