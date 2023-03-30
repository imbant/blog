const go = async () => {
    const gif = {
        gifList: [
            `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAkCAYAAADckvn+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAMLSURBVGhD7dhZ6A1RAMfxsZQtITuFRLYHe0iWpPCkbOWBlz+ikBdSku1BvFjKmhLlRaGUPCBLInmx5oGyliiyl933N/ecf8dx/v//vdfce2du/199muXOvXfOmZmzTNSYxpQ0s7Ekt1qbpTiDyfFWhjMMv/Eu3splI7RP9mtHVtMFr6CCfEcLdDbbd3ACF9Fgmppl2nIKKuQePMViHMFnzMQXtEYmsxy6UuvjrSh6BHtbXsdas34QmUsbfMKDeOvvZ05+OOs6ZjAylbHQye/FQrNen2+YhMzkAnTiesbcgpyHbkm7/wPmQl2IruQgpD7z4BbKeohmUPZB+07GW7lcgRqlYNLUim4ySz8v8DO3Gj0xy3ZmqXTADPSMtyqctvCb91ZQd+BfOUsd/XT0w02zT33jduww2zIa/6SJWZYqfTEH06Aa7gS1hNegW68rpqKh2lf/J+obQ3mOMXgZb5Uh7XEAqmlbw6U0H8H87xVUjfaBbg8NpX5B/VgNytVH6fbW4CCxdISGTqfxGKEaLZfNSCy62qopjQ1Df1Yu6twPYyISiQq2ALfg/5kKew5HcRZf4R+TJI1FB6Dg6HkZjm5QS9cLI7ESGin4f3QDGkm0hI2a/2fwj01SfxScXdCXVfv3oZNUk+z/uKgG1YCEokrRECr0vSTcRVEDk9CP+a5CV6y+dMdHhL6fhOMoKsug4ZD7Y69xD1sxDvlEz6odLJeCWu2io2dJrZKGRCOg4VMxWY3QyeVDlRrab2luWPGMQujk6nIZuoNUuZrsLkJdo5+BqHjGQ/1U6AR9mubYaZCbDfCP3YmikvR0SVch39/cBjsNcvPGLN0cMsuCk3QBNbMOXZVQNOTzo2d/RW61NrqN1eClIhoc+LeXZupbvH1yCX402HCP0TvQUEVUNHp94J7kLCjr4O4X/4VRD6hQeo71el7TrtRlKNxCvIXNGryH/UyF9tMcqX+JdBtuIVfBRrP83dDIpLd2ZDF6v+mOZ/W6bwiqKhPgFvIYqi5ToH5NBfSb/6qJnrMKvV6Poj88Ktarg+U1WwAAAABJRU5ErkJggg==`,
            `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAkCAYAAADckvn+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAMcSURBVGhD7dlLqA1xAMfx4/1eKK/IgkJeWSBSHguECMlzIxGysJEkIWVBNkhZyYaNVyIJIXkVC6+wEvIorzzzfn2/58zU3GPuPffeMaczt/urT3P+c+6dO/+Z//8///nfXMYyGMvRJF8qZAwOY26+lOG0wQP8QTd3kMmwrAvuyHLOIKzMUHeQV/iJA7iLlqiSpsG20rMD43EQ9zAFm9AJU3ENXfEbmYt3y7t2Pl/K5U7Bu+a+51iIL7iJTMa+9RW2Nu/iD4RN1YqFn59hJDKVdvDkL2MUvgXlmsxCZrINnvSnYBs6ja14E5R/YS2W4inGouLTD9FKhex3Di5mDdx3K18qZD8ciFpYqORRdHuwLc5bvC58zD8mTPNga6xTf9hfKy4dMBuOlMV3LmQ/XIkRuB7sk3duC74H5RWoMuVJOzYZp1XD0As+txwF7V9+1xt9Ec5SSsWKtip8jM0keKFSj01mAx4ivNpp24l8anMH+2BgsO2B9vAgnrhl78JLeKyPuIGrcIQbjfUYjnLlChxFnQxUG585G3EO71B8hUr5DCsd912ajqA1YjMRjlwOuXG/XIm8S7agE5iDfxI20dvwXSsuHsjh2InsEzhr98DhxNZjNINXbgI6o1yxK8zEi3yphhxCeFX8YWft6zAfQ+CD1b5XKva58Djl4Ahsq2uLkhkAny3VtuFaxPeyuBNJmyO0rSe1eIcvIu6Pl9Nm/Pf4wpnmMy6cUNfWXjgmJM48pDniPsYq+Mo0CMcR93NxZiBRFiPuwEk5iT6JZbBixXHlzHfDuN+NStQfnQz7/hV34FKcPzoBcPLwHmexB04qfA7XZqQ2LmPsQ/TYj+AFCBek6pXpiB60Llw4ckJtJRyUuiBp7CYuOPm4mOaOJPEx4lUvPnGbVam+6Nt2mukZbOsdr7YzmOITPwrvxurIviibTeIrW444+Y6e+CWE6x6+k1mR6Pdy1OuITMQX0kXYjQXuiGQJiit3DA0muxCtnCteDSYu9txHWDkXhLqjYpJ0Vc1K3Sl8zH3AOLis16Dif3QcKV0wakxjGlOX5HJ/Afr7FCMj5TWnAAAAAElFTkSuQmCC`,
            `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAkCAYAAADckvn+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAALkSURBVGhD7dhZ6A1RAMfxEbJkJ1GWSInEP5JdRF5QspQlSlF4kOxKocgDDx4kPJEsiZC9LA+UJdnzQsgSEUJkyfL93ZlT43Tuve69Z+ZS86tP/5nT/95zzsyZM+fcIEuWLFnKSAtcw0PUUUGUqdiJ/rmz/zRd8Ri/8EoFUXZAZbJBBUqt6K8rujIj0RE90QWN8BMNcQ/n8AKnkEa64SJ0B69D7VGHF2EjzqAZbmI2nGmMxXgAc0WKOYslUIVJpS7uQ/UNjLzEvqjsGFT/XaizeaMxHG98KZ5iIZrAd9ZDdUzKnQXBCcTr3oT90fEQ5OIaosugL/uOG1Cjn0ND4wcaQB3oDQ3b4bDzDAtwMHdWeZpCbfiGEVBnhiJfBuByeOhOB7QLD4umBlsRv5rGfMSj2W08tmAP5mEU1IF80U3Q86bv+xz9NT7ikVUm+r/O8Jph0NRtV6a7OBeHY2W219iGHrCzC/k+o+dQE87RqEyjbi124wLqw2s0u26H3ZhSaA7QnV2O81GZyxGYTIHK4o+EOrg0PPSfCXgLu1E+aUbV3VPMRdW70OQqjoeHyUSTgt0o3y5BrwkNTZ2/w3TMic7jd9lr9AzEG1It4+A1/bAXrsrSdhJe0h5aOdyGq6K0fYGGbT1UnDHQgtdVUdpWog9awku04nFVVC3aQXi5a4oW1q5Kqk1LSc0BWgCUFa0MzKrhXzcLhbaDzqyD68tK9QZP8CFWloSaUnuoHcWg8PCPaF2o2Ut7tjYqyJPT0HLqAPRSbo3u6IRPUIdbQSNFk9dXaOM9GlrPFov+/z30ee0mpqGkrIa5OlrFr0AvaA2qzl1B/AoaavwMVBLVU2gTrl8a9AuEogtXVtSJyZgIe/e+Cq6K9cz62ro0xxq46hGtoBKJrq6rQs22SaQvzO7ddgjeXhcm2tjaFf3NM1NpZuIO7LrHwmsGQ+8gfbl+ZdMwTiu1oedbd+4WNqMtsmTJkiVLlsIJgt8aIks/FXkpUwAAAABJRU5ErkJggg==`,
            `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAkCAYAAADckvn+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAL+SURBVGhD7dlZ6ExRAMfxsYWyJHsh+x5CWZ4oL7Y3yosl9ce//pIkZMsLIuXRIymUELI9SbK8kEK2EoVkS/ad72/uPX+n48x+z4z/NL/6NHeZufeeuWfOPedMqpZaaqlomsWvmdIZCzAZfdEOrfAcl3ESF9FkcxS/c7iFteiIJpdV+ApfwVxPoIK2x3+TXFVUGYE++AZVz1/ohmkYjEmwcx+z8CC9VgUZhd34CHM39RsdiNBZiU3RYvioEToBu5ADECLjcB46zyNtsKJaNTxaDBO7YbqhDQlnPczxf+IAlO44DLNPLX+wXIA50T5tIB0wDxsxFr1RaHZBx7wJ3SV9gTugmqI7qX0P49cZCJbx+A5TyGt4aq3LJ6jw+VanZdDn9qbXUqlheAc1Zm+hfdOxNF7vhKCx72I2HzAb2VKHH1BLPhXr4B7nNGbiPfQzCRr1gJ7BvYhsMrWGK2De8wV2zbB9tpbVCAXNKdgnz9cx9ITJQvjeJ7qbx6Eq6u7T54JlCtwTFuINduKItc1nNRQ9Fl5B2+7hDF6iF4JEnW/3YkJQQ2ain4MeGWqdlYMwj49EMxG+iwnhEIZiQ7yuxqollCV4HS0ml/5Q1XAvJCQVyiyrj7wdamDu4jYSzRrYJ6+0eiQajSrUsvlOVm7q1bRA4jkH3wnL6Q40vAsSje59Jw3tBTSFshxtECyX4LsAUVerAXOhB7Quyve+QqhjoOeg5orKEt9jQgXbhiGwo9HFHGifOuOP4X42F32hZY896BU9OvKJGgVNg+gOb4W+GPs4mWh4FLRr5mY07AvQ0KWYKqQJL/s4uVyFpjjzmWcqOW5jU8z8TBfYx8iXJska0zx+TTpX4leTYu6gOtB7osV/oh6ML9ehuaDGhLqdGtttiRbT6QpdcKFpC/3GeqTX/kajDXWo+0H79AWqYOqfqrMRPBNgqsx+bSghY6B+pl0Nz6Li0aTPIrROr5UWzX/aBZT5qKpshlvIkaiq6N8su4CqvlUVNYqLod7PIG3InlTqDxYAJrxQlZdFAAAAAElFTkSuQmCC`,
            `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADgAAAAkCAYAAADckvn+AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAK8SURBVGhD7dhZyExhHMfxY4lkSXGhrFmyxIXEBeXChbLcKCWSpVzJhSxv3OFCUhIRcSERV2QrLkUuZMkaoSzJTiRLFL7fmXnqNJ0z7+u8c4aZ5lef3jPPO+875z9znv/znImaaaaZZpqJooXYgS6FRw2WFvwu6eMA6Ys9uI95DtRjOuIIQnHPYLriHsL4AdRljsECdmEtLHA8zsPxlbiKvai7rEMozmzET3yG4xY8Fl+wDKnpUPqZV4ZgInznB8LXe4oTuIKk9MQnPMYwbMZ6hPzCSUxHJ/THB9Qs/bAUp/ANvuNJLNLu2BkhI+Fl5+9tIBdLx2k+Yjhqktk4jLdIOpk0d7Edh+All/QcP6FtOBcbC16hB3KJl8dqXEf5C1eTrxFyE469gHPRS/kgWs0kOFfakgHYhNcoP5k8zEfIJTi2ovAoiobiJaYUHqXEkw3/bD+c3EkZhy14g/D8WrAhTcYq2GQcWwTjom93XVN4VJbQRV1j7HIhX+F6Y8ezPffGGExAWud17vWCC3EtcgNb4dxfgCVIvVTnIm2CV2I7Pw275mCEDlhrzsPuqJgROIukfxBnUXY8W/wgxHMZSX+TNz/BNmcOLOAhbpd4fBRuj2wwadmApBPI007ULDanpJPIg910Biomj63abiwvHlYtLubujN7Bee6cs8n8k7j1svEkvetZPED5XP8vcgZJJ/w33MuOQuZ4U5lX3Ey3N9/xvHiYLXkWGN84ZI2NxE1H5uRZoLdN7c17uDXLnDwLdN10+9aedCv9zBzviPPKExzHHVyAxY5G0mv6Kfn78u3WPrg7qpv4/UlSt5wKvxJ0nYuPuzOqu7iuhQJ+YCZCriFeoFdA3cUb1FmwMC/ZeLwriRd4Cw2XRwgFOjcr3qm3ljy7aNYshjsY4155WvGwseKXui4z3rZVY8PQqImiP4tHrWv/oCm4AAAAAElFTkSuQmCC`
        ],
        index: -1,
        next() {
            this.index += 1
            if (this.index > this.gifList.length - 1) {
                this.index = 0
            }
            return this.gifList[this.index]
        }
    }

    setInterval(() => {
        const link = document.querySelector("head > link[rel='icon']")
        const url = gif.next()
        link.setAttribute('href', url)
    }, 500)
}
go()